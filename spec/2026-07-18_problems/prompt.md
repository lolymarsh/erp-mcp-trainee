สิ่งที่ผมเข้าไปตรวจสอบแล้วเจอนะครับ ในแต่ละหน้า ขาด CREATE และ PATCH ครับ flow ครบแล้วจริงๆใช่มั้ยครับ อิงจาก /Users/lolymarsh/Desktop/versus_thailand_work/erp-mcp-trainee/spec/2026-07-18_core และ api บาง module พบเจออะไรแปลกๆครับ

- หน้า login ยังไม่มี validate error แสดงเลยครับ เช่นกดปุ่ม login ยังไม่ใส่ user name password ดันไม่มีไรขึ้นมาแสดงแจ้งเตือน กรอบแดงตรง input ไรงี้และมีข้อความ error พวกรหัสผ่านผิด ไรงี้ 

- หน้า ลูกค้า ไม่มีเพิ่ม และ แก้ไข หรือ เป็นแบบนี้อยู่แล้ว 
และไม่มีหน้าแก้ไข หรือลบใช่มั้ยครับหากอิงจาก core

- สินค้า ไม่มีเพิ่ม และ แก้ไข หรือ เป็นแบบนี้อยู่แล้ว 
และไม่มีหน้าแก้ไข หรือลบใช่มั้ยครับหากอิงจาก core

- module /Users/lolymarsh/Desktop/versus_thailand_work/erp-mcp-trainee/backend/src/modules/invoice ทำไม service call db ตรงๆได้ ทำไมไม่ call repo และ transaction อยากให้เริ่มที่ service ครับ rollback ก็ที่ service ทำ defer แบบ go ได้มั้ย และเช็ค module อื่นด้วย ว่ามีปัญหาแบบเดียวกันมั้ย ทำไมมีเรียก db ใน service ข้อนี้อัพเดทลง rules ให้ด้วย /Users/lolymarsh/Desktop/versus_thailand_work/erp-mcp-trainee/backend/src/modules/inventory
/Users/lolymarsh/Desktop/versus_thailand_work/erp-mcp-trainee/.claude
/Users/lolymarsh/Desktop/versus_thailand_work/erp-mcp-trainee/.agent
/Users/lolymarsh/Desktop/versus_thailand_work/erp-mcp-trainee/AGENTS.mds

- และปัญหา implement หลายๆ plan แล้วไม่มี route หน้าบ้านครับ ต้องสั่งซ้ำตลอด 

- และหน้าไหนยิง api list ข้อมูล อยากให้มี skeleton loading ครับ และ search อยากให้มี debounce ครับ หน่วงก่อน search ตอนนี้พิมพ์ปุ๊บยิง api รั่วๆเลย 

- และหน้า 404 ยังไม่มี handle ครับ อยากให้มีการ handle ไม่พบหน้าอะไรแบบนี้ และหน้าอื่นๆที่ไม่ใ่ช 404 จะมีหน้าอะไรอีกทีต้อง handle

- หน้า jobs เพิ่มแก้ไขลบ jobs ยังไง ลองเช็ค core feature หน่อย 

- ai chat ผมต้องเอา key จากไหน และ handle หาก api error ยังไงในยหน้า ai chat จะ return อะไรหรือ toast หรือ popup ว่าเกิดปัญหาอะไร

แยก phase ลง /Users/lolymarsh/Desktop/versus_thailand_work/erp-mcp-trainee/spec/2026-07-18_problems นะคึครับ ก่อนสร้างแยก phase สร้าง plan.md ลง /Users/lolymarsh/Desktop/versus_thailand_work/erp-mcp-trainee/spec/2026-07-18_problems ก่อนนะครับ