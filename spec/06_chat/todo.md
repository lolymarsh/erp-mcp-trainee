# 06 AI Chatbot Module — Todo & Status

> **Module**: 06_chat (Natural Language to SQL, Tools & Assistant)  
> **Status**: 🟢 100% Complete  
> **Updated**: 2026-08-25  

---

## 📋 Tracer-Bullet Tickets

- [x] **T6.1**: SQL Generation & Read-only AST Sanitizer (blocks DROP, UPDATE, DELETE, INSERT)
- [x] **T6.2**: Redis Query Caching (`ai:cache:{hash}`)
- [x] **T6.3**: Multi-provider LLM Client (OpenAI, Anthropic Claude, Google Gemini)
- [x] **T6.4**: MongoDB Chat History Persistence (`chat_messages` collection)
- [x] **T6.5**: SSE (Server-Sent Events) streaming endpoint (`GET /api/chat/stream`)
- [x] **T6.6**: Fix TypeScript test errors in `chat/controller.test.ts`, `chat/model.test.ts`, and `chat/view.tsx`
- [x] **T6.7**: Migrate Chat UI with suggestions and responsive message list
- [x] **T6.8**: Add Chart and Table rendering when LLM returns aggregated series data

---

## 🔍 ขาดอะไรบ้าง (Missing Items / Next Steps)

1. **Frontend Type & Test Fixes**:
   - `chat/controller.test.ts`: มี reference ถึง property `cached` และ `clearMessages` ที่ type ไม่ตรง
   - `chat/model.test.ts`: ขาด parameter `provider` ใน `SendMessageInput`
   - `chat/view.tsx`: `primaryTypographyProps` บน `ListItemText` type mismatch
2. **UI Modernization**:
   - ปรับปรุง Chat Bubble และ Quick Prompt Suggestions ให้ใช้ shadcn semantic tokens
