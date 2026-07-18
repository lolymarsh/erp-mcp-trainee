# Phase 08 — AI Chat Fixes

> **Priority**: 🟡 P1
> **Estimate**: 0.75 day
> **Depends on**: Nothing (standalone)

---

## Problem Summary

1. ไม่มี document ว่า API key มาจากไหน
2. Error handling ใน frontend ไม่ cover ทุกกรณี (LLM error, timeout, sanitizer block, network error)
3. Chat history ไม่เคยโหลด (`chatApi.getHistory()` มีใน model แต่ controller ไม่เคยเรียก)

---

## Task 8.1 — Document API Key Source (0.25 day)

### OpenAI API Key

```bash
# .env
OPENAI_API_KEY=sk-...          # Required — from https://platform.openai.com/api-keys
OPENAI_MODEL=gpt-4o-mini       # Optional — default: gpt-4o-mini
```

### Source code reference
- `backend/src/modules/chat/service.ts:89`: `apiKey: process.env.OPENAI_API_KEY || ""`
- `backend/src/modules/chat/service.ts:156`: `model: process.env.OPENAI_MODEL || "gpt-4o-mini"`

### Actions
- [ ] Add `OPENAI_API_KEY` + `OPENAI_MODEL` to `.env.example`
- [ ] Add comment in `chat/service.ts` constructor explaining key source
- [ ] Add README section (optional)

---

## Task 8.2 — Error Handling in Frontend Chat (0.35 day)

### Current: SSE `error` event → Alert dismissable

### New: Categorized error display

### 8.2.1 Update Backend — Return categorized errors

```ts
// chat/service.ts — callLLM
private async callLLM(systemPrompt: string, question: string): Promise<string> {
  try {
    // ... existing OpenAI call ...
  } catch (err: unknown) {
    logger.error({ err }, "LLM call failed");
    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) {
        throw new AppError(500, "OPENAI_KEY_INVALID", "API key ไม่ถูกต้อง");
      }
      if (err.status === 429) {
        throw new AppError(500, "OPENAI_RATE_LIMIT", "AI ทำงานหนักเกินไป กรุณาลองใหม่ใน 1 นาที");
      }
    }
    throw new AppError(500, "LLM_ERROR", "ไม่สามารถสร้าง SQL ได้ กรุณาลองใหม่");
  }
}
```

### 8.2.2 Update Frontend — Error mapping

```ts
// chat/controller.ts — useChat
const errorMessages: Record<string, string> = {
  OPENAI_KEY_INVALID: "API key ไม่ถูกต้อง กรุณาตรวจสอบ OPENAI_API_KEY ใน .env",
  OPENAI_RATE_LIMIT: "AI ทำงานหนักเกินไป กรุณาลองใหม่ใน 1 นาที",
  SQL_TIMEOUT: "Query ใช้เวลานานเกินไป ลองถามใหม่ด้วยคำที่เจาะจงขึ้น",
  SQL_BLOCKED: "คำถามนี้ไม่ปลอดภัย กรุณาถามใหม่",
  LLM_ERROR: "ไม่สามารถสร้าง SQL ได้ กรุณาลองใหม่",
  NETWORK_ERROR: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
};

function getErrorMessage(error: SSEError | Error): { message: string; severity: 'error' | 'warning' } {
  if (error instanceof TypeError) { // Network error
    return { message: errorMessages.NETWORK_ERROR, severity: 'error' };
  }
  const code = (error as any).code as string;
  return {
    message: errorMessages[code] ?? (error as any).message ?? 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ',
    severity: 'error',
  };
}
```

### 8.2.3 Error Display

| Error Type | Display Method |
|------------|---------------|
| Network error (fetch fail) | Toast/Snackbar — auto dismiss 6s |
| API key invalid | Toast/Snackbar — persistent until dismissed |
| SQL timeout | Chat bubble (assistant): "Query ใช้เวลานานเกินไป..." + retry button |
| SQL blocked by sanitizer | Chat bubble: "คำถามนี้ไม่ปลอดภัย..." |
| LLM error | Toast/Snackbar |
| Empty result | Chat bubble: "ไม่พบข้อมูล" (มีอยู่แล้ว) |

---

## Task 8.3 — Chat History Loading (0.15 day)

### Current
- `chatApi.getHistory()` exists in model
- Controller generates new `sessionId` on mount, never loads history

### Fix
- Save `sessionId` to `localStorage` after first message
- On page mount: if `sessionId` exists in localStorage → call `getHistory(sessionId)` → populate initial messages
- Optional: session selector / "clear chat" resets session

```ts
// chat/controller.ts
const SESSION_KEY = 'chat_session_id';

export function useChat() {
  const [sessionId] = useState(() => {
    return localStorage.getItem(SESSION_KEY) || `session-${Date.now()}`;
  });

  const loadHistory = async () => {
    try {
      const history = await chatApi.getHistory(sessionId);
      setMessages(history.map(msg => ({
        id: `history-${Date.now()}`,
        role: 'assistant',
        content: msg.response,
        sql: msg.sql,
        cached: msg.cached,
      })));
    } catch {
      // silent — history is optional
    }
  };

  useEffect(() => {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) loadHistory();
  }, [sessionId]);
}
```

---

## Phase 08 Checklist

- [ ] `.env.example` — add `OPENAI_API_KEY` + `OPENAI_MODEL`
- [ ] `chat/service.ts` — comment explaining key source
- [ ] `chat/service.ts` — categorized errors (OPENAI_KEY_INVALID, OPENAI_RATE_LIMIT, SQL_TIMEOUT, SQL_BLOCKED, LLM_ERROR)
- [ ] `chat/handler.ts` — pass error codes to SSE response
- [ ] `chat/controller.ts` — error message mapping + categorized display
- [ ] Network error → Toast/Snackbar
- [ ] API key error → persistent Toast
- [ ] SQL timeout → chat bubble with retry
- [ ] `sessionId` saved to localStorage on first message
- [ ] Load history on page revisit
- [ ] Run `npm run typecheck` — pass
