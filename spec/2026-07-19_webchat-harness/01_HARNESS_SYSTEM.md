# Harness System — WebChat แบบ OpenCode

> เปลี่ยน AI Chat จาก "ถาม-ตอบ SQL" → "Agent ที่เรียก Tools ได้"
> Inspired by OpenCode's tool/harness architecture

---

## สถาปัตยกรรม

```
Frontend (React)
  ChatPanel (view.tsx)
    ├── MessageBubble        ← render ผลลัพธ์จาก tool ต่างๆ
    ├── ToolCallBlock        ← แสดง tool ที่ AI เรียก + status
    └── ToolResultBlock      ← render result ตาม type (table/chart/code/file)
         ↓ HTTP/SSE
Backend (Express)
  ToolRegistry
    ├── sql-executor         ← execute SELECT query (ของเดิม)
    ├── file-reader          ← อ่านไฟล์ (logs, reports, configs)
    ├── data-exporter        ← export CSV/Excel/PDF
    ├── chart-generator      ← generate chart URL/image
    ├── pdf-report           ← generate PDF report
    ├── email-sender         ← ส่ง email ถึงลูกค้า (optional)
    └── ...                  ← เพิ่มได้เรื่อยๆ

  ToolCallHandler
    ├── parse tool call จาก LLM response
    ├── execute tool + return result
    └── ส่งผลลัพธ์กลับไปให้ LLM ต่อ (multi-turn)
```

---

## Phase 1 — Tool Registry + Function Calling

### Backend

#### 1. Tool Registry (`backend/src/modules/chat/tools/registry.ts`)

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

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition): void;
  get(name: string): ToolDefinition | undefined;
  list(): ToolDefinition[];
  getSystemPrompt(): string;  // generate tool descriptions for LLM
}
```

#### 2. Built-in Tools

| Tool | Name | Description |
|------|------|-------------|
| SQL Query | `sql_query` | Execute SELECT query |
| List Tables | `list_tables` | SHOW TABLES |
| Describe Table | `describe_table` | DESCRIBE table |
| Export CSV | `export_csv` | Export query result as CSV |
| Export HTML | `export_html` | Export query result as HTML table |
| Generate Chart | `generate_chart` | สร้าง chart URL จาก data (QuickChart.io หรือ Chart.js server-side) |

#### 3. Tool-enabled LLM Call (`service.ts`)

เปลี่ยนจาก `callLLM` ที่ส่งแค่ system prompt + history → ส่ง **tool definitions** ให้ LLM ด้วย (OpenAI / OpenRouter รองรับ function calling)

```ts
// เรียก LLM พร้อม tools
const tools = registry.list().map(t => ({
  type: "function",
  function: {
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  },
}));

const completion = await client.chat.completions.create({
  model: "...",
  messages: [...],
  tools,
  tool_choice: "auto",
});
```

#### 4. Multi-turn Execution Loop

```ts
async function askWithTools(input, userId, sessionId) {
  let messages = [systemPrompt, ...history, userMessage];
  let maxTurns = 5;

  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await llm.chat.completions.create({ messages, tools });

    if (response.choices[0].finish_reason === "stop") {
      // LLM ตอบข้อความปกติ → ส่งกลับ user
      return response.choices[0].message.content;
    }

    if (response.choices[0].finish_reason === "tool_calls") {
      // LLM เรียก tool
      const toolCalls = response.choices[0].message.tool_calls;
      for (const call of toolCalls) {
        const result = await registry.execute(call.function.name, JSON.parse(call.function.arguments));
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      // loop ต่อไป — LLM จะตอบกลับหรือเรียก tool เพิ่ม
    }
  }
}
```

### Frontend

#### 5. Tool Call UI (`view.tsx`)

เพิ่ม component `ToolCallBlock` สำหรับแสดง tool call ใน chat:

```tsx
function ToolCallBlock({ call }: { call: ToolCall }) {
  return (
    <Paper sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <BuildIcon fontSize="small" />
        <Typography variant="caption" fontWeight={600}>
          {call.toolName}
        </Typography>
        {call.status === 'running' && <CircularProgress size={14} />}
        {call.status === 'done' && <CheckCircleIcon fontSize="small" color="success" />}
        {call.status === 'error' && <ErrorIcon fontSize="small" color="error" />}
      </Box>
      {call.status === 'done' && call.result && (
        <ToolResultBlock result={call.result} />
      )}
    </Paper>
  );
}

function ToolResultBlock({ result }: { result: ToolResult }) {
  switch (result.type) {
    case 'table':
      return <HtmlTable data={result.data} />;
    case 'chart':
      return <img src={result.data} />;
    case 'html':
      return <div dangerouslySetInnerHTML={{ __html: result.data }} />;
    default:
      return <pre>{result.formatted}</pre>;
  }
}
```

---

## Phase 2 — Rich Harnesses

### 6. File Reader Tool

```ts
registry.register({
  name: "read_file",
  description: "อ่านเนื้อหาไฟล์ในระบบ (logs, reports, configs)",
  parameters: z.object({
    path: z.string().describe("relative path จาก project root"),
  }),
  execute: async ({ path }) => {
    const content = await fs.readFile(path, 'utf-8');
    return { type: "text", data: content };
  },
});
```

**Security**: path ต้องอยู่ใน whitelist (`/var/log`, `/etc/reports`,等项目目录)

### 7. PDF Report Tool

```ts
registry.register({
  name: "generate_report",
  description: "สร้าง PDF report สรุปข้อมูล (ยอดขาย, สินค้าคงคลัง, งานติดตั้ง)",
  parameters: z.object({
    type: z.enum(["sales", "inventory", "jobs", "customers"]),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
  }),
  execute: async ({ type, date_from, date_to }) => {
    const data = await fetchReportData(type, date_from, date_to);
    const pdf = await generatePdf(type, data);
    return { type: "html", data: pdf.url };
  },
});
```

### 8. Chart Generator Tool

```ts
registry.register({
  name: "generate_chart",
  description: "สร้างกราฟจากข้อมูล (แท่ง, เส้น, วงกลม)",
  parameters: z.object({
    chart_type: z.enum(["bar", "line", "pie"]),
    title: z.string(),
    labels: z.array(z.string()),
    datasets: z.array(z.object({ label: z.string(), data: z.array(z.number()) })),
  }),
  execute: async (args) => {
    const url = await generateChartImage(args);
    return { type: "chart", data: url };
  },
});
```

---

## Phase 3 — Agent Mode

### 9. Agent Loop (Multi-step Planning)

LLM ไม่ได้เรียก tool แค่ครั้งเดียว แต่สามารถ:
1. รับคำถาม user
2. วางแผนว่าจะใช้ tool อะไรบ้าง
3. เรียก tool ทีละตัว
4. ดูผลลัพธ์ + ตัดสินใจเรียก tool ถัดไป
5. สรุปตอบ user

```ts
interface AgentStep {
  tool: string;
  args: Record<string, unknown>;
  result: ToolResult;
  timestamp: Date;
}

interface AgentRun {
  sessionId: string;
  question: string;
  steps: AgentStep[];
  finalAnswer?: string;
}
```

### 10. Agent State Management

บันทึก agent run ลง MongoDB เพื่อให้ user เห็น history การทำงานของ agent:

```ts
// entity.ts
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

## Phase 4 — Frontend Agent UI

### 11. Agent Timeline View

```tsx
function AgentMessage({ run }: { run: AgentRun }) {
  return (
    <Box>
      <Typography variant="body2">{run.question}</Typography>
      <Timeline>
        {run.steps.map((step, i) => (
          <TimelineItem key={i}>
            <TimelineSeparator>
              <TimelineDot color={step.status === 'done' ? 'success' : 'grey'} />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="caption" fontWeight={600}>{step.toolName}</Typography>
              <ToolResultBlock result={step.result} />
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
      {run.finalAnswer && (
        <Typography variant="body2" sx={{ mt: 1 }}>{run.finalAnswer}</Typography>
      )}
    </Box>
  );
}
```

### 12. Chart Rendering

```tsx
function ChartResult({ url }: { url: string }) {
  return (
    <Box sx={{ maxWidth: '100%', my: 1 }}>
      <img src={url} alt="Chart" style={{ maxWidth: '100%', borderRadius: 8 }} />
    </Box>
  );
}
```

ใช้ QuickChart.io (free) หรือ Chart.js server-side สำหรับ generate chart images

---

## ไฟล์ที่ต้องสร้าง/แก้ไข

### Backend (ใหม่)
| ไฟล์ | Description |
|------|-------------|
| `tools/registry.ts` | ToolRegistry class |
| `tools/sql-query.ts` | SQL executor tool |
| `tools/export.ts` | Export tool |
| `tools/chart.ts` | Chart generator tool |
| `tools/file-reader.ts` | File reader tool (optional) |
| `agent.ts` | Agent loop + state management |
| `agent-run.entity.ts` | AgentRunDocument interface |

### Backend (แก้ไข)
| ไฟล์ | Change |
|------|--------|
| `service.ts` | เปลี่ยน callLLM → agent loop ที่รองรับ tool calls |
| `handler.ts` | ถ้า agent mode, stream tool calls + results |
| `route.ts` | เพิ่ม route สำหรับ agent |
| `schema.ts` | เพิ่ม agent mode fields |

### Frontend (ใหม่)
| ไฟล์ | Description |
|------|-------------|
| `ToolCallBlock.tsx` | แสดง tool call + status |
| `ToolResultBlock.tsx` | render result ตาม type |
| `ChartResult.tsx` | chart image viewer |
| `AgentTimeline.tsx` | timeline แสดงขั้นตอน agent |

### Frontend (แก้ไข)
| ไฟล์ | Change |
|------|--------|
| `model.ts` | เพิ่ม types สำหรับ tool calls, agent runs |
| `controller.ts` | จัดการ agent state, multi-step streaming |
| `view.tsx` | เพิ่ม ToolCallBlock ใน message list |

---

## Implementation Order

```
Phase 1 (Week 1):
  ├── ToolRegistry + sql_query tool
  ├── Function calling integration (OpenAI/OpenRouter)
  └── ToolCallBlock UI

Phase 2 (Week 2):
  ├── export_csv / export_html tools
  ├── generate_chart tool
  └── ToolResultBlock + chart rendering

Phase 3 (Week 3):
  ├── Agent loop (multi-turn)
  ├── AgentRun MongoDB persistence
  └── Agent timeline UI

Phase 4 (Week 4):
  ├── file_reader tool (whitelist paths)
  ├── pdf_report tool
  └── polish + edge cases
```

---

## Dependencies ที่ต้องเพิ่ม

```bash
# Backend
npm install quickchart-js    # server-side chart generation
npm install puppeteer        # PDF generation (optional)

# Frontend
npm install recharts         # client-side charts (มีอยู่แล้ว)
npm install @mui/x-tree-view # timeline UI
```
