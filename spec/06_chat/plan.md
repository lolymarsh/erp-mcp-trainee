# Phase 06 — AI Chatbot

> **Priority**: 🔴 High — Core feature
> **Estimate**: 4-5 days
> **Depends on**: Phase 01-05 (all modules — for DB schema context)

---

## Overview

AI Chatbot is the heart of this ERP. It translates natural language (Thai/English) into SQL queries, executes them read-only against MySQL, and returns formatted results. A harness/tool-calling system extends capabilities beyond SQL — charts, file reads, PDF reports, and multi-step agent planning.

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            ChatPanel (MUI + Tailwind)                  │  │
│  │  - Text Input (Thai/English)                           │  │
│  │  - Message History (scrollable, auto-scroll)           │  │
│  │  - Format Selector (Text/Table/CSV/HTML/JSON)          │  │
│  │  - ToolCallBlock (show tool calls + status)            │  │
│  │  - ToolResultBlock (table/chart/code/file render)      │  │
│  │  - Streaming indicator (SSE)                            │  │
│  └──────────────────────┬───────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────┘
                          │ HTTP / SSE (Streaming)
┌─────────────────────────▼──────────────────────────────────┐
│                   Backend (Express)                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ChatService.ask()                          │  │
│  │  1. Check Redis cache: ai:cache:{md5(question)}        │  │
│  │  2. Build system prompt with DB schema                  │  │
│  │  3. Call LLM with tools (function calling)              │  │
│  │  4. Parse LLM response → SQL or tool call               │  │
│  │  5. SQL Sanitizer (read-only guard)                     │  │
│  │  6. Execute on MySQL (5s timeout, light queries)         │  │
│  │  7. OR publish to RabbitMQ if heavy → return jobId      │  │
│  │  8. Cache result in Redis (10min TTL)                    │  │
│  │  9. Fire-and-forget → audit.log → MongoDB               │  │
│  │  10. Format & Return (SSE streaming)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌─ ToolRegistry ────────────────────────────────────────┐  │
│  │  sql_query, list_tables, describe_table, export_csv,   │  │
│  │  export_html, generate_chart, read_file, generate_report │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────── Workers (RabbitMQ Consumers) ─────────────┐  │
│  │  aiWorker.ts:   erp.ai.expensive_queue → heavy queries │  │
│  │  auditWorker.ts: erp.audit.log → MongoDB               │  │
│  └──────────────────────────────────────────────────────┘  │
└──────┬──────────────┬──────────────┬────────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌───▼──────────────┐
│   MySQL     │ │   Redis    │ │   RabbitMQ       │
│  (SQL)      │ │  (Cache)   │ │ (Message Queue)  │
│             │ │            │ │                  │
│ Business    │ │ Dashboard  │ │ ai.expensive     │
│ Data,       │ │ Cache,     │ │ notifications    │
│ Invoices,   │ │ AI Cache   │ │ audit.log        │
│ Jobs,       │ │ Rate Limit │ │ stock.alerts     │
│ Inventory   │ └────────────┘ └──────┬───────────┘
└─────────────┘                       │
                            ┌─────────▼──────────┐
                            │     MongoDB         │
                            │    (NoSQL)          │
                            │                    │
                            │ Chat History,      │
                            │ Activity Logs,     │
                            │ Audit Trail        │
                            └────────────────────┘
```

---

## Task 1 — LLM Integration + SQL Generation

**Files**: `backend/src/modules/chat/`

| File | Responsibility |
|------|---------------|
| `entity.ts` | ChatMessage (MongoDB document interface) |
| `schema.ts` | sendMessageSchema, ChatResponse, ExportFormat (text/csv/html/json) |
| `service.ts` | ChatService — build context, call LLM, parse → SQL |
| `sanitizer.ts` | SQL read-only guard |
| `formatter.ts` | Format results (CSV, HTML, JSON, Table) |

### sanitizer.ts — Critical

```ts
export function sanitizeSql(sql: string): string {
  const upper = sql.toUpperCase().trim();
  const blocked = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'CREATE', 'EXEC', 'EXECUTE'];
  for (const keyword of blocked) {
    if (upper.includes(keyword)) {
      throw new ForbiddenError(`SQL keyword '${keyword}' is not allowed`);
    }
  }
  if (!upper.startsWith('SELECT')) {
    throw new ForbiddenError('Only SELECT queries are allowed');
  }
  return sql;
}
```

### service.ts — LLM Call Flow

```ts
async ask(question: string, format: string): Promise<ChatResponse> {
  // 1. Check Redis cache
  const cached = await redis.get(`ai:cache:${md5(question)}`);
  if (cached) return JSON.parse(cached);

  // 2. Build system prompt with DB schema
  const systemPrompt = buildSystemPrompt();

  // 3. Call LLM (OpenAI/Gemini) with tools
  const llmResponse = await callLLM(systemPrompt, question, tools);

  // 4. Extract SQL from LLM response
  const sql = extractSQL(llmResponse);

  // 5. Sanitize
  sanitizeSql(sql);

  // 6. Execute on MySQL (with 5s timeout)
  const result = await executeWithTimeout(sql, 5000);

  // 7. Format result
  const formatted = formatResult(result, format);

  // 8. Cache in Redis (10min TTL)
  await redis.setex(`ai:cache:${md5(question)}`, 600, JSON.stringify(formatted));

  // 9. Fire-and-forget → save to MongoDB via RabbitMQ
  publishToQueue('erp.audit.log', { question, sql, resultCount: result.length });

  return formatted;
}
```

### Streaming (SSE)

```
Frontend                         Backend
   │  POST /api/chat/send          │
   │──────────────────────────────►│
   │  SSE: data: { "type": "sql_generated", "sql": "SELECT ..." }
   │◄──────────────────────────────│
   │  SSE: data: { "type": "executing", "elapsed": 120 }
   │◄──────────────────────────────│
   │  SSE: data: { "type": "result", "rows": 6, "data": [...] }
   │◄──────────────────────────────│
   │  SSE: data: { "type": "done" }
   │◄──────────────────────────────│
```

### Light vs Heavy Query

```
Light query (< 1s estimated):
  ChatService → execute SQL → return immediately via SSE

Heavy query (export, multi-month report):
  ChatService → publish to erp.ai.expensive → return { jobId } immediately
  aiWorker → pick up → execute → store result in Redis → publish to erp.notifications
  Frontend polls GET /api/chat/job/:jobId every 2s → when done → display result
```

---

## Task 2 — Chat Backend

**Files**: `backend/src/modules/chat/`

| File | Responsibility |
|------|---------------|
| `handler.ts` | ChatHandler: sendMessage(), getHistory(), exportResult() |
| `repo_mongo.ts` | ChatMongoRepository — save/retrieve chat history |
| `repo_mysql.ts` | Execute generated SQL (read-only) |
| `route.ts` | POST /send, GET /history, POST /export |

**Routes**:
```
POST /api/chat/send     ← { question: "วันนี้ยอดเท่าไหร่", format: "text" }
GET  /api/chat/history  ← get last 50 messages by session
POST /api/chat/export   ← export last result as CSV/HTML/JSON file
```

---

## Task 3 — Chat Frontend

**Files**: `frontend/src/modules/chat/`

| File | Responsibility |
|------|---------------|
| `model.ts` | chatApi.send(), SSE streaming, ChatMessage type |
| `controller.ts` | useChat() hook: messages, send, streaming, format select, export |
| `view.tsx` | ChatPanel, MessageBubble, FormatSelector, ExportButton |

### ChatPanel UI

- Message list (scrollable, auto-scroll to bottom)
- User message (right-aligned, blue bubble)
- AI response (left-aligned, white bubble — text/table/CSV depending on format)
- Text input + send button
- Format selector dropdown (Text, Table, CSV, HTML, JSON)
- Export button (download last result)
- Loading indicator while waiting
- ToolCallBlock — shows tool call name + status (running/done/error)
- ToolResultBlock — renders table/chart/html according to result type

---

## Task 4 — Harness / Tool-Calling System

**Files**: `backend/src/modules/chat/tools/`

| File | Responsibility |
|------|---------------|
| `registry.ts` | ToolRegistry class — register, get, list, generate system prompt |
| `sql-query.ts` | SQL executor tool |
| `export.ts` | Export CSV/HTML tool |
| `chart.ts` | Chart generator tool (QuickChart.io) |
| `file-reader.ts` | File reader tool (whitelist paths) |

### ToolRegistry

```ts
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: z.ZodObject<any>;
  execute: (args: Record<string, unknown>, deps: ToolDeps) => Promise<ToolResult>;
}

export interface ToolResult {
  type: "table" | "text" | "json" | "html" | "error";
  data: unknown;
  formatted?: string;
}
```

| Tool | Name | Description |
|------|------|-------------|
| SQL Query | `sql_query` | Execute SELECT query |
| List Tables | `list_tables` | SHOW TABLES |
| Describe Table | `describe_table` | DESCRIBE table |
| Export CSV | `export_csv` | Export query result as CSV |
| Export HTML | `export_html` | Export query result as HTML table |
| Generate Chart | `generate_chart` | สร้าง chart URL จาก data |
| Read File | `read_file` | อ่านเนื้อหาไฟล์ (whitelist paths) |
| PDF Report | `generate_report` | สร้าง PDF report |

### Multi-turn Agent Loop

```ts
async function askWithTools(input, userId, sessionId) {
  let messages = [systemPrompt, ...history, userMessage];
  let maxTurns = 5;

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await llm.chat.completions.create({ messages, tools });

    if (response.choices[0].finish_reason === "stop") {
      return response.choices[0].message.content;
    }

    if (response.choices[0].finish_reason === "tool_calls") {
      const toolCalls = response.choices[0].message.tool_calls;
      for (const call of toolCalls) {
        const result = await registry.execute(call.function.name, JSON.parse(call.function.arguments));
        messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
      }
      // loop continues — LLM may call more tools or respond
    }
  }
}
```

### Agent State (MongoDB)

```ts
export interface AgentRunDocument {
  _id: string;
  sessionId: string;
  userId: string;
  question: string;
  steps: Array<{
    toolName: string;
    arguments: Record<string, unknown>;
    result: ToolResult;
    status: "running" | "done" | "error";
    startedAt: Date;
    completedAt?: Date;
  }>;
  finalAnswer?: string;
  createdAt: Date;
}
```

---

## Task 5 — Async Worker + Notify

**Files**: `backend/src/workers/`

| File | Responsibility |
|------|---------------|
| `aiWorker.ts` | Consumer: `erp.ai.expensive_query` — heavy queries offloaded here |
| `auditWorker.ts` | Consumer: `erp.audit.log` — saves to MongoDB |

---

## LLM System Prompt Strategy

```
You are an ERP assistant for Versus Thailand, a car gas installation company.
You translate user questions into MySQL queries.

Database schema:
[INSERT TABLE SCHEMAS HERE]

Rules:
1. Only SELECT queries. NEVER INSERT, UPDATE, DELETE, DROP, ALTER.
2. Always use LIMIT 100 unless user asks for more.
3. Use Thai-friendly column names. Dates are in Asia/Bangkok timezone.
4. Today = CURRENT_DATE at timezone 'Asia/Bangkok'
5. Respond in Thai language.
```

---

## LLM Model Recommendation

| Provider | Model | Thai Support | Cost |
|----------|-------|-------------|------|
| **OpenAI** | GPT-4o-mini | Excellent | ~$3-5/1M tokens |
| **Anthropic** | Claude 3.5 Sonnet | Good | ~$3/1M tokens |
| **Google** | Gemini 1.5 Flash | Excellent | Free tier available |
| **Open-source** | Qwen 2.5 | Good | Self-hosted |

**Recommendation**: Start with Gemini Flash (free/cheap) or GPT-4o-mini (quality/price balance).

---

## Example Queries

| User Ask | Intent | SQL |
|----------|--------|-----|
| "วันนี้ยอดขายเท่าไหร่" | `sales_summary_today` | `SELECT SUM(grand_total) FROM invoices WHERE DATE(created_at) = CURDATE()` |
| "วันนี้มีรถเข้าคิวกี่คัน" | `job_queue_today` | `SELECT COUNT(*) FROM jobs WHERE DATE(scheduled_date) = CURDATE()` |
| "สต็อกถังแก๊ส 58L เหลือเท่าไหร่" | `inventory_check` | `SELECT current_stock FROM products WHERE name LIKE '%58L%'` |
| "ช่างสมชายทำยอดเดือนนี้เท่าไหร่" | `technician_sales` | `SELECT SUM(total_amount) FROM jobs WHERE technician_id = (SELECT id FROM users WHERE display_name = 'สมชาย')` |

---

## Task Checklist

```
[ ] POST /api/chat/send "วันนี้ยอดขายเท่าไหร่" → correct SQL + result
[ ] POST /api/chat/send "สินค้าใกล้หมดมีอะไรบ้าง" → filtered result
[ ] POST /api/chat/send with format=csv → CSV file download
[ ] POST /api/chat/send with format=html → HTML table response
[ ] SQL sanitizer rejects DROP, DELETE, UPDATE, INSERT
[ ] Redis cache: same question twice → second call instant (no LLM call)
[ ] Chat history saved to MongoDB
[ ] Audit worker: logs written to MongoDB
[ ] ToolRegistry: register + execute sql_query tool
[ ] ToolRegistry: multi-turn agent loop (max 5 turns)
[ ] AgentRun saved to MongoDB for history
[ ] ToolCallBlock UI: show tool name + status icon
[ ] ToolResultBlock: render table, chart, html results
[ ] Frontend: chat UI with send/receive
[ ] Frontend: streaming SSE display
[ ] Frontend: format selector + export button
[ ] Frontend: loading state while waiting
[ ] Integration tests: valid query, blocked query, cache hit
```

---

## Dependencies

```bash
# Backend
npm install openai              # or @google/generative-ai
npm install quickchart-js       # server-side chart generation
npm install puppeteer           # PDF generation (optional)

# Frontend — all already in project
# recharts, @mui/x-tree-view
```

---

## Implementation Order

```
Phase 1 (Week 1):
  ├── LLM integration + SQL generation
  ├── SQL sanitizer + formatter
  ├── Chat backend (handler, repo_mongo, route)
  └── Chat frontend (model, view, controller)

Phase 2 (Week 2):
  ├── ToolRegistry + sql_query tool
  ├── Function calling integration (OpenAI/OpenRouter)
  ├── ToolCallBlock + ToolResultBlock UI
  ├── export_csv / export_html tools
  └── generate_chart tool

Phase 3 (Week 3):
  ├── Agent loop (multi-turn)
  ├── AgentRun MongoDB persistence
  └── Agent timeline UI

Phase 4 (Week 4):
  ├── file_reader tool (whitelist paths)
  ├── pdf_report tool (Puppeteer)
  └── Polish + edge cases
```

---

> **Next**: Phase 07 — Dashboard
