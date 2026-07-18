# Phase 06 — AI Chatbot

> **Priority**: 🔴 High — Core feature
> **Estimate**: 3-4 days
> **Depends on**: Phase 01-05 (all modules — for DB schema context)

---

## Task 6.1 — LLM Integration + SQL Generation (1 day)

**Files**: `backend/src/modules/chat/`

| File | Responsibility |
|------|---------------|
| `entity.ts` | ChatMessage (MongoDB document interface) |
| `schema.ts` | sendMessageSchema, ChatResponse, ExportFormat (text/csv/html/json) |
| `service.ts` | ChatService — build context, call LLM, parse → SQL |
| `sanitizer.ts` | SQL read-only guard |
| `formatter.ts` | Format results (CSV, HTML, JSON, Table) |

**sanitizer.ts — Critical**:
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

**service.ts — LLM Call**:
```ts
async ask(question: string, format: string): Promise<ChatResponse> {
  // 1. Check Redis cache: ai:cache:{md5(question)}
  const cached = await redis.get(`ai:cache:${md5(question)}`);
  if (cached) return JSON.parse(cached);

  // 2. Build system prompt with DB schema (from all entity files)
  const systemPrompt = buildSystemPrompt();

  // 3. Call LLM (OpenAI/Gemini)
  const llmResponse = await callLLM(systemPrompt, question);

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

  // 9. Fire-and-forget → save to MongoDB
  publishToQueue('erp.audit.log', { question, sql, resultCount: result.length });

  return formatted;
}
```

---

## Task 6.2 — Chat Backend (0.5 day)

**Files**: `backend/src/modules/chat/`

| File | Responsibility |
|------|---------------|
| `handler.ts` | ChatHandler: sendMessage(), getHistory(), exportResult() |
| `repo_mongo.ts` | ChatMongoRepository — save/retrieve chat history |
| `route.ts` | POST /send, GET /history, POST /export |

**Routes**:
```
POST /api/chat/send     ← { question: "วันนี้ยอดเท่าไหร่", format: "text" }
GET  /api/chat/history  ← get last 50 messages by session
POST /api/chat/export   ← export last result as CSV/HTML/JSON file
```

---

## Task 6.3 — Chat Frontend (1.5 days)

**Files**: `frontend/src/modules/chat/`

| File | Responsibility |
|------|---------------|
| `model.ts` | chatApi.send(), SSE streaming, ChatMessage type |
| `controller.ts` | useChat() hook: messages, send, streaming, format select, export |
| `view.tsx` | ChatPanel, MessageBubble, FormatSelector, ExportButton |

**ChatPanel UI**:
- Message list (scrollable, auto-scroll to bottom)
- User message (right-aligned, blue bubble)
- AI response (left-aligned, white bubble — text/table/CSV depending on format)
- Text input + send button
- Format selector dropdown (Text, Table, CSV, HTML, JSON)
- Export button (download last result)
- Loading indicator while waiting

**Streaming (SSE)**:
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

---

## Task 6.4 — Async Worker + Notify (1 day)

**Files**: `backend/src/workers/`

| File | Responsibility |
|------|---------------|
| `aiWorker.ts` | Consumer: `erp.ai.expensive_query` — heavy queries offloaded here |
| `auditWorker.ts` | Consumer: `erp.audit.log` — saves to MongoDB |

**Flow**:
```
Light query (< 1s estimated):
  ChatService → execute SQL → return immediately via SSE

Heavy query (export, multi-month report):
  ChatService → publish to erp.ai.expensive → return { jobId } immediately
  aiWorker → pick up → execute → store result in Redis → publish to erp.notifications
  Frontend polls GET /api/chat/job/:jobId every 2s → when done → display result
```

---

## Phase 06 Checklist

```
[ ] POST /api/chat/send "วันนี้ยอดขายเท่าไหร่" → correct SQL + result
[ ] POST /api/chat/send "สินค้าใกล้หมดมีอะไรบ้าง" → filtered result
[ ] POST /api/chat/send with format=csv → CSV file download
[ ] POST /api/chat/send with format=html → HTML table response
[ ] SQL sanitizer rejects DROP, DELETE, UPDATE, INSERT
[ ] Redis cache: same question twice → second call instant (no LLM call)
[ ] Chat history saved to MongoDB
[ ] Audit worker: logs written to MongoDB
[ ] Frontend: chat UI with send/receive
[ ] Frontend: streaming SSE display
[ ] Frontend: format selector + export button
[ ] Frontend: loading state while waiting
[ ] Integration tests: valid query, blocked query, cache hit
```

> **Next**: Phase 07 — Dashboard
