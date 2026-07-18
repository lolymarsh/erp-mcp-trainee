# Prompt — Phase 09: Rules Update

implement phase 09 ตาม spec/2026-07-18_problems/09_RULES.md

สิ่งที่ต้องทำ — อัพเดท 6 ไฟล์ (3 ไฟล์ × 2 paths):

  .agent/rules/ServicePatterns.md:
    - เพิ่ม Section 7: "Service MUST NOT access DB directly"
    - ❌ Do NOT inject db: MySql2Database into service constructor
    - ❌ Do NOT import drizzle-orm helpers (eq, and, isNull)
    - ❌ Do NOT import schema tables from other modules
    - ✅ Cross-module → inject other repo interfaces
    - ✅ Exception: Chat module → raw mysql2 Pool for AI SQL

  .agent/rules/RepositoryPatterns.md:
    - เพิ่ม Section 10: "Cross-Module Repository Queries"
    - Option A: Service injects other repo interfaces (preferred)
    - Option B: Add cross-table methods to repo interface

  .agent/rules/OpenCodeStandards.md:
    - เพิ่ม "Service Dependencies" section
    - Service may receive: Repo interfaces, Service interfaces, infra (Redis, RMQ)
    - Service MUST NOT receive: raw DB, Drizzle helpers, Schema objects, Express req/res

  .claude/rules/ServicePatterns.md — copy same as .agent
  .claude/rules/RepositoryPatterns.md — copy same as .agent
  .claude/rules/OpenCodeStandards.md — copy same as .agent

อย่าลืม:
  - .agent/ และ .claude/ ต้องมีเนื้อหาเหมือนกัน
  - เพิ่ม section ไม่ใช่ replace — content เดิมยังอยู่
  - ใช้ภาษาไทยตามไฟล์เดิม
