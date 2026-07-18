# Prompt — Phase 06: AI Chatbot

```
implement phase 06 ตาม spec/2026-07-18_core/06_AI_CHAT.md

อ่าน AGENTS.md + ARCHITECTURE.md ก่อนเริ่ม
ตามกฎ: DI, SQL sanitizer (read-only), Redis cache, MongoDB history

สิ่งที่ต้องทำ:
  backend:  modules/chat/ (entity, schema, handler, service, repo_mysql, repo_mongo, sanitizer, formatter, route, test)
  workers:  aiWorker.ts, auditWorker.ts (RabbitMQ consumers)
  frontend: modules/chat/ (model, controller, view)
  tests:    integration + unit

CRITICAL:
  - sanitizer.ts: block DROP, DELETE, UPDATE, INSERT, ALTER, TRUNCATE — SELECT only
  - service.ts flow: check Redis cache → build prompt → call LLM → extract SQL → sanitize → execute → cache result → log to MongoDB
  - Streaming via SSE: sql_generated → executing → result → done
  - Heavy queries → publish to RabbitMQ → return jobId → frontend poll GET /job/:id

อย่าลืม:
  - Redis cache key: ai:cache:{md5(question)} — TTL 10 min
  - SQL timeout 5s
  - Format: text, table, csv, html, json
  - Frontend: ChatPanel + MessageBubble + FormatSelector + ExportButton
  - MongoDB: save chat history + audit logs
```
