import crypto from "node:crypto";
import type { Pool } from "mysql2/promise";
import type { Db } from "mongodb";
import type Redis from "ioredis";
import type { RowDataPacket } from "mysql2/promise";
import OpenAI from "openai";
import { logger } from "../../config/logger";
import { publishToQueue } from "../../config/rabbitmq";
import { sanitizeSql } from "./sanitizer";
import { formatResult } from "./formatter";
import type { SendMessageInput, ChatResponse } from "./schema";
import { ChatMongoRepository } from "./repo_mongo";
import type { IChatMongoRepository } from "./repo_mongo";
import type { ChatMessageDocument } from "./entity";
import type { RabbitMQConnection } from "../../config/rabbitmq";

const CACHE_TTL = 600;
const QUERY_TIMEOUT_MS = 5000;

function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

function buildSystemPrompt(): string {
  return `You are a SQL expert for an ERP system for an auto gas installation business in Thailand.

The database has the following tables:

1. users (id, username, password_hash, display_name, role [ADMIN|MANAGER|STAFF|TECHNICIAN], is_active, version, created_at, updated_at, deleted_at)

2. customers (id, first_name, last_name, phone, email, address, version, created_at, updated_at, deleted_at)

3. vehicles (id, customer_id, license_plate, brand, model, year, engine_type, fuel_type)

4. categories (id, name, description)

5. products (id, category_id, sku, name, description, unit, cost_price, sell_price, min_stock, current_stock, version, created_at, updated_at, deleted_at)

6. stock_movements (id, product_id, type [IN|OUT|ADJUST], quantity, reference_type, reference_id, created_by, note, created_at)

7. invoices (id, invoice_number, customer_id, vehicle_id, total_amount, discount, tax, grand_total, payment_status [PENDING|PAID|PARTIAL|REFUNDED], payment_method [CASH|BANK_TRANSFER|CREDIT|PROMPTPAY], version, created_by, created_at, updated_at)

8. invoice_items (id, invoice_id, product_id, quantity, unit_price, total)

9. jobs (id, customer_id, vehicle_id, invoice_id, job_type [INSTALL|REPAIR|INSPECT], status [QUEUED|IN_PROGRESS|COMPLETED|CANCELLED], scheduled_date, start_time, end_time, technician_id, notes, version, created_at, updated_at)

10. job_status_logs (id, job_id, from_status, to_status, changed_by, note, created_at)

Rules:
- Always use SELECT only. Never use INSERT, UPDATE, DELETE, DROP, etc.
- Use MySQL syntax.
- For "today", use CURDATE() for date comparison.
- For Thai language questions about sums/totals, use aggregation functions like SUM(), COUNT(), AVG().
- For "close to running out" or "near minimum stock", compare current_stock <= min_stock.
- For "today's sales", query invoices where DATE(created_at) = CURDATE().
- For "today's revenue", SUM(grand_total) from invoices WHERE DATE(created_at) = CURDATE() AND payment_status != 'REFUNDED'.
- Always include proper table names and column names as defined above.
- Return ONLY the SQL query, nothing else. Do not include explanations, markdown formatting, or code blocks.
- The SQL must start with SELECT.`;
}

function extractSQL(response: string): string {
  const trimmed = response.trim();
  const codeBlockMatch = trimmed.match(/```(?:sql)?\s*\n?([\s\S]*?)```/i);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  return trimmed;
}

export interface IChatService {
  ask(input: SendMessageInput, userId: string, sessionId: string): Promise<ChatResponse>;
  getHistory(sessionId: string, limit?: number): Promise<ChatMessageDocument[]>;
  executeHeavyQuery(sql: string): Promise<Record<string, unknown>[]>;
}

export class ChatService implements IChatService {
  private mongoRepo: IChatMongoRepository;
  private llmClient: OpenAI;

  constructor(
    private dbPool: Pool,
    private redis: Redis,
    mongoDb: Db,
    private rmq: RabbitMQConnection,
  ) {
    this.mongoRepo = new ChatMongoRepository(mongoDb);
    this.llmClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
  }

  async ask(
    input: SendMessageInput,
    userId: string,
    sessionId: string,
  ): Promise<ChatResponse> {
    const cacheKey = `ai:cache:${md5(`${input.question}:${input.format}`)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      const parsed: ChatResponse = JSON.parse(cached);
      parsed.cached = true;
      this.saveToMongo(userId, sessionId, parsed).catch((err: unknown) => {
        logger.error({ err }, "Failed to save cached chat to MongoDB");
      });
      return parsed;
    }

    const systemPrompt = buildSystemPrompt();
    const llmResponse = await this.callLLM(systemPrompt, input.question);
    const sql = extractSQL(llmResponse);
    sanitizeSql(sql);

    const rawResult = await this.executeWithTimeout(sql, QUERY_TIMEOUT_MS);
    const data = rawResult as Record<string, unknown>[];
    const formatted = formatResult(data, input.format);

    const response: ChatResponse = {
      question: input.question,
      sql,
      resultCount: data.length,
      data,
      formatted,
      format: input.format,
      cached: false,
    };

    await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(response));
    this.saveToMongo(userId, sessionId, response).catch((err: unknown) => {
      logger.error({ err }, "Failed to save chat to MongoDB");
    });
    this.publishAuditLog(userId, sessionId, input.question, sql, data.length);

    return response;
  }

  async getHistory(
    sessionId: string,
    limit?: number,
  ): Promise<ChatMessageDocument[]> {
    return this.mongoRepo.getHistory(sessionId, limit);
  }

  async executeHeavyQuery(sql: string): Promise<Record<string, unknown>[]> {
    sanitizeSql(sql);
    const rawResult = await this.executeWithTimeout(sql, 60000);
    return rawResult as Record<string, unknown>[];
  }

  private async callLLM(
    systemPrompt: string,
    question: string,
  ): Promise<string> {
    try {
      const completion = await this.llmClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        temperature: 0.1,
        max_tokens: 500,
      });
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("LLM returned empty response");
      }
      return content;
    } catch (err: unknown) {
      logger.error({ err }, "LLM call failed");
      throw new Error("Failed to generate SQL query. Please try again.");
    }
  }

  private async executeWithTimeout(
    sql: string,
    timeoutMs: number,
  ): Promise<RowDataPacket[]> {
    const connection = await this.dbPool.getConnection();
    try {
      await connection.execute(`SET SESSION max_execution_time = ${timeoutMs}`);
      const [rows] = await connection.execute<RowDataPacket[]>(sql);
      return rows;
    } finally {
      connection.release();
    }
  }

  private async saveToMongo(
    userId: string,
    sessionId: string,
    response: ChatResponse,
  ): Promise<void> {
    await this.mongoRepo.save({
      sessionId,
      userId,
      question: response.question,
      sql: response.sql,
      resultCount: response.resultCount,
      format: response.format,
      response: response.formatted,
      cached: response.cached,
      createdAt: new Date(),
    });
  }

  private publishAuditLog(
    userId: string,
    sessionId: string,
    question: string,
    sql: string,
    resultCount: number,
  ): void {
    try {
      publishToQueue(this.rmq, "erp.audit.log", {
        entityType: "chat",
        entityId: sessionId,
        userId,
        action: "ai_query",
        details: { question, sql, resultCount },
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      logger.error({ err }, "Failed to publish audit log");
    }
  }
}
