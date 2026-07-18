# Prompt — Phase 08: AI Chat Fixes

implement phase 08 ตาม spec/2026-07-18_problems/08_AI_CHAT.md

อ่าน AGENTS.md + ARCHITECTURE.md ก่อนเริ่ม
ตามกฎ: environment variables, SSE error handling, localStorage

สิ่งที่ต้องทำ:
  backend:
    - chat/service.ts: เพิ่ม categorized error codes (OPENAI_KEY_INVALID, OPENAI_RATE_LIMIT, SQL_TIMEOUT, SQL_BLOCKED, LLM_ERROR)
    - chat/service.ts: OpenAI APIError handling — 401 → OPENAI_KEY_INVALID, 429 → OPENAI_RATE_LIMIT
    - chat/handler.ts: pass error codes to SSE response (ส่ง code field ใน error event)
    - .env.example: เพิ่ม OPENAI_API_KEY=sk-... + OPENAI_MODEL=gpt-4o-mini
    - chat/service.ts: comment explaining key source (process.env.OPENAI_API_KEY)

  frontend:
    - chat/controller.ts: error message mapping (code → Thai message)
    - chat/controller.ts: NetworkError → Toast/Snackbar "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้"
    - chat/controller.ts: API key error → persistent Toast "กรุณาตรวจสอบ OPENAI_API_KEY"
    - chat/controller.ts: SQL timeout → chat bubble assistant "Query ใช้เวลานานเกินไป..." + retry button
    - chat/controller.ts: SQL blocked → chat bubble "คำถามนี้ไม่ปลอดภัย กรุณาถามใหม่"
    - chat/controller.ts: save sessionId to localStorage after first message
    - chat/controller.ts: load history (chatApi.getHistory) on page mount if sessionId exists
    - chat/view.tsx: add new chat / clear session button (reset sessionId)

CRITICAL — Error Codes:
  - Backend sends: { type: 'error', code: 'OPENAI_KEY_INVALID', message: '...' }
  - Frontend maps: code → Thai user-friendly message + display method (toast vs bubble)
  - Network error (TypeError on fetch) → separate handling (ไม่ใช่จาก SSE)

CRITICAL — Chat History:
  - SESSION_KEY = 'chat_session_id' in localStorage
  - On mount: if key exists → chatApi.getHistory(sessionId) → populate initial messages
  - On first message sent: save sessionId to localStorage
  - Clear chat button: clear localStorage + reset messages

อย่าลืม:
  - Toast/Snackbar: MUI Snackbar + Alert, autoHide 6s (except API key error — persistent)
  - Chat bubble error: same style as assistant message but with warning color
  - Retry button: re-send the same question
  - History loading: silent fail (history is optional feature)
