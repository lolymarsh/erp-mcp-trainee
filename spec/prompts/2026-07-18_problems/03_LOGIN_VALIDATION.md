# Prompt — Phase 03: Login Validation + Error Display

implement phase 03 ตาม spec/2026-07-18_problems/03_LOGIN_VALIDATION.md

อ่าน AGENTS.md + ARCHITECTURE.md ก่อนเริ่ม
ตามกฎ: Zod validation, MUI error/helperText props, frontend MVC

สิ่งที่ต้องทำ:
  frontend:
    - modules/auth/model.ts: เพิ่ม Zod loginFormSchema (username min 1, password min 1)
    - modules/auth/view.tsx: TextField รับ error={!!fieldErrors.xxx} + helperText={fieldErrors.xxx}
    - modules/auth/view.tsx: ก่อน submit → Zod parse → ไม่ผ่าน = ไม่ call API
    - modules/auth/view.tsx: map API error string → field-level errors (password: "รหัสผ่านไม่ถูกต้อง", username: "ไม่พบผู้ใช้")
    - modules/auth/view.tsx: clear field errors on typing
    - modules/auth/view.tsx: show password toggle (InputAdornment + IconButton + VisibilityIcon)
    - modules/auth/view.tsx: disabled={loading || !username.trim() || !password.trim()}
    - autoFocus on username field
    - optional: onBlur validate field เดี่ยว

ห้าม:
  - ใช้ alert() หรือ window.prompt() แสดง error
  - ใช้ console.log แสดง error
  - เปลี่ยน API contract (ยัง POST /auth/login เหมือนเดิม)

อย่าลืม:
  - Zod schema ใน model.ts (ไม่ใช่ใน view.tsx)
  - error prop + helperText ต้องเป็นภาษาไทย
  - Loading state: แสดง CircularProgress ขนาด 24px แทน text ปุ่ม
