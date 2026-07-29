import type { Pool } from "mysql2/promise";
import type { Db } from "mongodb";
import type Redis from "ioredis";
import type { RowDataPacket } from "mysql2/promise";
import OpenAI from "openai";
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import { logger } from "../../config/logger";
import { publishToQueue } from "../../config/rabbitmq";
import { SanitizeSql } from "./sanitizer";
import { FormatResult } from "./formatter";
import type { SendMessageInput, ChatResponse } from "./schema";
import { ChatMongoRepository } from "./repo_mongo";
import type { IChatMongoRepository } from "./repo_mongo";
import type { ChatMessageDocument, SessionSummary } from "./entity";
import type { RabbitMQConnection } from "../../config/rabbitmq";
import { AppError } from "../../shared/errors/AppError";

const QUERY_TIMEOUT_MS = 5000;

const PROVIDER_ENV_MAP: Record<string, { key: string; label: string }> = {
  openai: { key: "OPENAI_API_KEY", label: "OpenAI" },
  gemini: { key: "GEMINI_API_KEY", label: "Gemini" },
  openrouter: { key: "OPENROUTER_API_KEY", label: "OpenRouter" },
};

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
  Ask(input: SendMessageInput, userId: string, sessionId: string): Promise<ChatResponse>;
  GetHistory(sessionId: string, limit?: number): Promise<ChatMessageDocument[]>;
  ListSessions(userId: string, limit?: number): Promise<SessionSummary[]>;
  ExecuteHeavyQuery(sql: string): Promise<Record<string, unknown>[]>;
}

export class ChatService implements IChatService {
  private mongoRepo: IChatMongoRepository;
  private openaiClient: OpenAI | null;
  private geminiClient: GoogleGenerativeAI | null;
  private openrouterClient: OpenAI | null;

  constructor(
    private dbPool: Pool,
    _redis: Redis,
    mongoDb: Db,
    private rmq: RabbitMQConnection,
  ) {
    this.mongoRepo = new ChatMongoRepository(mongoDb);

    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
    } else {
      this.openaiClient = null as unknown as OpenAI;
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    this.geminiClient = geminiKey ? new GoogleGenerativeAI(geminiKey) : null as unknown as GoogleGenerativeAI;

    const orKey = process.env.OPENROUTER_API_KEY;
    if (orKey) {
      this.openrouterClient = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: orKey,
      });
    } else {
      this.openrouterClient = null as unknown as OpenAI;
    }
  }

  async Ask(
    input: SendMessageInput,
    userId: string,
    sessionId: string,
  ): Promise<ChatResponse> {
    const envInfo = PROVIDER_ENV_MAP[input.provider];
    if (!envInfo) {
      throw new AppError(400, "INVALID_PROVIDER", { userMessage: `ไม่รองรับ provider: ${input.provider}` });
    }
    const apiKey = process.env[envInfo.key];
    if (!apiKey) {
      throw new AppError(400, "MISSING_API_KEY", { userMessage: `ไม่ได้ตั้งค่า ${envInfo.key} ใน .env` });
    }

    const systemPrompt = buildSystemPrompt();
    const historyDocs = await this.mongoRepo.GetHistoryAsc(sessionId, 10);

    const llmResponse = await this.callLLM(systemPrompt, input, historyDocs);
    const sql = extractSQL(llmResponse);

    try {
      SanitizeSql(sql);
    } catch {
      throw new AppError(400, "SQL_BLOCKED", { userMessage: "คำถามนี้ไม่ปลอดภัย กรุณาถามใหม่" });
    }

    let rawResult: RowDataPacket[];
    try {
      rawResult = await this.executeWithTimeout(sql, QUERY_TIMEOUT_MS);
    } catch (err: unknown) {
      if (err instanceof Error && (err.message?.toLowerCase().includes("timeout") || err.message?.toLowerCase().includes("max_execution_time") || err.message?.toLowerCase().includes("interrupted"))) {
        throw new AppError(500, "SQL_TIMEOUT", { userMessage: "Query ใช้เวลานานเกินไป ลองถามใหม่ด้วยคำที่เจาะจงขึ้น" });
      }
      throw err;
    }
    const data = rawResult as Record<string, unknown>[];
    const formatted = FormatResult(data, input.format);

    const response: ChatResponse = {
      question: input.question,
      sql,
      resultCount: data.length,
      data,
      formatted,
      format: input.format,
    };

    this.saveToMongo(userId, sessionId, response).catch((err: unknown) => {
      logger.error({ err }, "Failed to save chat to MongoDB");
    });
    this.publishAuditLog(userId, sessionId, input.question, sql, data.length);

    return response;
  }

  async GetHistory(
    sessionId: string,
    limit?: number,
  ): Promise<ChatMessageDocument[]> {
    return this.mongoRepo.GetHistory(sessionId, limit);
  }

  async ListSessions(userId: string, limit = 50): Promise<SessionSummary[]> {
    return this.mongoRepo.ListSessions(userId, limit);
  }

  async ExecuteHeavyQuery(sql: string): Promise<Record<string, unknown>[]> {
    SanitizeSql(sql);
    const rawResult = await this.executeWithTimeout(sql, 60000);
    return rawResult as Record<string, unknown>[];
  }

  private async callLLM(
    systemPrompt: string,
    input: SendMessageInput,
    historyDocs: ChatMessageDocument[],
  ): Promise<string> {
    const provider = input.provider;

    if (provider === "gemini") {
      return this.callGemini(systemPrompt, input, historyDocs);
    }
    return this.callOpenAICompatible(systemPrompt, input, historyDocs);
  }

  private async callOpenAICompatible(
    systemPrompt: string,
    input: SendMessageInput,
    historyDocs: ChatMessageDocument[],
  ): Promise<string> {
    const client = input.provider === "openrouter" ? this.openrouterClient! : this.openaiClient!;
    const modelName = input.model || this.getDefaultModel(input.provider);

    const history: OpenAI.Chat.ChatCompletionMessageParam[] = historyDocs.flatMap(doc => [
      { role: "user", content: doc.question },
      { role: "assistant", content: doc.response },
    ]);

    try {
      const completion = await client.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: input.question },
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
      logger.error({ err }, `${input.provider} LLM call failed`);
      if (err instanceof OpenAI.APIError) {
        if (err.status === 401 || err.status === 403) {
          throw new AppError(500, `${input.provider.toUpperCase()}_KEY_INVALID`.replace("OPENAI", "OPENAI"), { userMessage: `API key ของ ${input.provider} ไม่ถูกต้อง` });
        }
        if (err.status === 402) {
          throw new AppError(500, `${input.provider.toUpperCase()}_INSUFFICIENT_BALANCE`, { userMessage: "เครดิตไม่เพียงพอ หรือโมเดลนี้ต้องใช้เครดิต" });
        }
        if (err.status === 429) {
          throw new AppError(500, `${input.provider.toUpperCase()}_RATE_LIMIT`, { userMessage: "AI ทำงานหนักเกินไป กรุณาลองใหม่ใน 1 นาที" });
        }
      }
      throw new AppError(500, "LLM_ERROR", { userMessage: "ไม่สามารถสร้าง SQL ได้ กรุณาลองใหม่" });
    }
  }

  private async callGemini(
    systemPrompt: string,
    input: SendMessageInput,
    historyDocs: ChatMessageDocument[],
  ): Promise<string> {
    const modelName = input.model || process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";

    const history = historyDocs.flatMap(doc => [
      { role: "user", parts: [{ text: doc.question }] },
      { role: "model", parts: [{ text: doc.response }] },
    ]);

    try {
      const model = this.geminiClient!.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(input.question);
      const content = result.response.text();
      if (!content) {
        throw new Error("LLM returned empty response");
      }
      return content;
    } catch (err: unknown) {
      logger.error({ err }, "gemini LLM call failed");
      if (err instanceof GoogleGenerativeAIFetchError) {
        if (err.status === 401 || err.status === 403) {
          throw new AppError(500, "GEMINI_KEY_INVALID", { userMessage: "API key ของ Gemini ไม่ถูกต้อง" });
        }
        if (err.status === 429) {
          throw new AppError(500, "GEMINI_RATE_LIMIT", { userMessage: "AI ทำงานหนักเกินไป กรุณาลองใหม่ใน 1 นาที" });
        }
      }
      throw new AppError(500, "LLM_ERROR", { userMessage: "ไม่สามารถสร้าง SQL ได้ กรุณาลองใหม่" });
    }
  }

  private getDefaultModel(provider: string): string {
    switch (provider) {
      case "openai":
        return process.env.OPENAI_MODEL || "gpt-4o-mini";
      case "openrouter":
        return process.env.OPENROUTER_MODEL || "google/gemma-4-26b-a4b-it:free";
      default:
        return "gpt-4o-mini";
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
    await this.mongoRepo.Save({
      sessionId,
      userId,
      question: response.question,
      sql: response.sql,
      resultCount: response.resultCount,
      format: response.format,
      response: response.formatted,
      cached: false,
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
