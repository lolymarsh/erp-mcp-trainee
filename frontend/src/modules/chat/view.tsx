import React, { useState, useCallback } from 'react';
import {
  History,
  Plus,
  Download,
  Send,
  Square,
  RotateCcw,
  Bot,
  Loader2,
  MessageSquare,
  X,
} from 'lucide-react';
import { useChat } from './controller';
import type { ChatMessage } from './controller';
import type { ExportFormat, Provider } from './model';
import { PROVIDERS, PROVIDER_MODELS } from './model';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';

export function ChatPanel(): React.ReactElement {
  const {
    messages,
    loading,
    error,
    streaming,
    format,
    provider,
    model,
    sessions,
    sessionId,
    toast,
    messagesEndRef,
    setFormat,
    setProvider,
    setModel,
    sendMessage,
    cancelStream,
    newSession,
    switchSession,
    exportLastResult,
    retrySend,
    setError,
    hideToast,
  } = useChat();

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSend = useCallback(() => {
    if (!input.trim() || loading || streaming.active) {
      return;
    }
    void sendMessage(input);
    setInput('');
  }, [input, loading, streaming.active, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 relative">
      {/* Session History Sidebar Drawer */}
      {sidebarOpen && (
        <aside className="w-72 shrink-0 border border-neutral-200 bg-white rounded-xl shadow-lg dark:border-neutral-800 dark:bg-neutral-900 flex flex-col z-20 absolute md:static inset-y-0 left-0">
          <div className="p-3.5 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <History className="size-4" />
              <span>ประวัติแชท</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={newSession}
                title="เริ่มแชทใหม่"
                className="size-8"
              >
                <Plus className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="size-8 md:hidden"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.map((s) => (
              <button
                key={s.sessionId}
                type="button"
                onClick={() => {
                  void switchSession(s.sessionId);
                  setSidebarOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-lg text-sm flex items-start gap-2.5 transition-colors ${
                  s.sessionId === sessionId
                    ? 'bg-neutral-100 dark:bg-neutral-800 font-medium'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'
                }`}
              >
                <MessageSquare className="size-4 shrink-0 mt-0.5 text-neutral-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-neutral-900 dark:text-neutral-100">
                    {s.firstQuestion || '(empty)'}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {s.messageCount} ข้อความ · {new Date(s.lastActivity).toLocaleDateString('th-TH')}
                  </p>
                </div>
              </button>
            ))}
            {sessions.length === 0 && (
              <p className="p-4 text-center text-xs text-neutral-400">
                ยังไม่มีประวัติ
              </p>
            )}
          </div>
        </aside>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Chat Control Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mb-3 bg-white dark:bg-neutral-900 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-1.5"
          >
            <History className="size-4" />
            <span>ประวัติ</span>
          </Button>

          <h2 className="text-base font-bold tracking-tight mr-auto pl-1">AI Assistant</h2>

          <div className="w-32">
            <Select
              value={provider}
              onChange={(e) => setProvider(e.target.value as Provider)}
              className="h-8 text-xs"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>
          </div>

          <div className="w-40">
            <Select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="h-8 text-xs"
            >
              {(PROVIDER_MODELS[provider] || []).map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </Select>
          </div>

          <div className="w-24">
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              className="h-8 text-xs"
            >
              <option value="text">Text</option>
              <option value="table">Table</option>
              <option value="html">HTML</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </Select>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => void exportLastResult()}
            disabled={!messages.some((m) => m.role === 'assistant')}
            title="ส่งออกผลลัพธ์ล่าสุด"
            className="size-8"
          >
            <Download className="size-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={newSession}
            title="เริ่มแชทใหม่"
            className="size-8"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {error !== null && (
          <div
            role="alert"
            className="mb-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300 flex justify-between items-center"
          >
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {toast.open && (
          <div
            role="alert"
            className="mb-2 rounded-md border border-neutral-200 bg-neutral-900 text-white p-2.5 text-xs flex justify-between items-center"
          >
            <span>{toast.message}</span>
            <button onClick={hideToast} className="text-neutral-400 hover:text-white">
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {/* Message View Area */}
        <Card className="flex-1 overflow-y-auto p-4 mb-3 bg-neutral-50/50 dark:bg-neutral-950/50">
          {messages.length === 0 && !streaming.active && (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-neutral-400">
              <Bot className="size-10 mb-2 opacity-50" />
              <p className="text-sm">
                ถามคำถามเกี่ยวกับข้อมูลในระบบ เช่น “วันนี้ยอดขายเท่าไหร่” หรือ “สินค้าใกล้หมดมีอะไรบ้าง”
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onRetry={retrySend} />
          ))}

          {streaming.active && (
            <div className="mb-2">
              <StreamingIndicator state={streaming} format={format} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </Card>

        {/* Input Bar */}
        <div className="flex gap-2">
          <Textarea
            rows={1}
            placeholder="ถามคำถาม..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading || streaming.active}
            className="min-h-[42px] max-h-32 resize-none"
          />
          {loading || streaming.active ? (
            <Button
              variant="destructive"
              size="icon"
              onClick={cancelStream}
              className="size-[42px] shrink-0"
              title="ยกเลิก"
            >
              <Square className="size-4 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="size-[42px] shrink-0"
              title="ส่ง"
            >
              <Send className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onRetry,
}: {
  message: ChatMessage;
  onRetry?: (question: string) => void;
}): React.ReactElement {
  const isUser = message.role === 'user';
  const isHtml = message.format === 'html' && !isUser;

  return (
    <div
      className={`flex ${
        isUser ? 'justify-end' : 'justify-start'
      } mb-3`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isUser
            ? 'bg-neutral-900 text-white rounded-tr-xs dark:bg-neutral-100 dark:text-neutral-900'
            : message.isError
            ? 'bg-red-50 text-red-900 border border-red-200 rounded-tl-xs dark:bg-red-950/50 dark:text-red-200 dark:border-red-900'
            : 'bg-white text-neutral-900 border border-neutral-200 rounded-tl-xs dark:bg-neutral-900 dark:text-neutral-100 dark:border-neutral-800'
        }`}
      >
        {isHtml ? (
          <div
            className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:p-1.5 [&_th]:bg-neutral-100 dark:[&_th]:bg-neutral-800 [&_td]:border [&_td]:p-1.5"
            dangerouslySetInnerHTML={{ __html: message.content }}
          />
        ) : (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        )}

        {message.isError && message.errorCode === 'SQL_TIMEOUT' && message.retryQuestion && onRetry && (
          <div className="mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRetry(message.retryQuestion!)}
              className="flex items-center gap-1 h-7 text-xs"
            >
              <RotateCcw className="size-3" />
              <span>ลองอีกครั้ง</span>
            </Button>
          </div>
        )}

        {message.sql && (
          <div className="mt-2 pt-2 border-t border-neutral-200/50 dark:border-neutral-700/50">
            <p className="font-mono text-[11px] opacity-75 break-all">
              SQL: {message.sql}
            </p>
          </div>
        )}

        {message.resultCount !== undefined && (
          <div className="mt-2 flex gap-1">
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
              {message.resultCount} rows
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function StreamingIndicator({
  state,
  format,
}: {
  state: { sql: string; resultCount: number; data: Record<string, unknown>[] };
  format: string;
}): React.ReactElement {
  return (
    <div className="flex justify-start mb-2">
      <div className="max-w-[80%] rounded-2xl rounded-tl-xs p-3.5 bg-white border border-neutral-200 shadow-sm dark:bg-neutral-900 dark:border-neutral-800 text-xs">
        <div className="flex items-center gap-2 mb-1.5 text-neutral-600 dark:text-neutral-400">
          <Loader2 className="size-3.5 animate-spin text-neutral-900 dark:text-neutral-100" />
          <span>{state.sql ? 'กำลังประมวลผลคำสั่ง...' : 'กำลังสร้าง SQL...'}</span>
        </div>

        {state.sql && (
          <p className="font-mono text-[11px] text-neutral-500 break-all mb-2">
            {state.sql}
          </p>
        )}

        {state.resultCount > 0 && (
          <div>
            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 mb-2">
              {state.resultCount} rows so far
            </Badge>
            <div className="max-h-48 overflow-auto font-mono text-[11px] bg-neutral-50 dark:bg-neutral-950 p-2 rounded border">
              {formatPreview(state.data, format)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatPreview(data: Record<string, unknown>[], format: string): string {
  if (data.length === 0) return '';
  const columns = Object.keys(data[0]);
  if (format === 'json') {
    return JSON.stringify(data.slice(0, 5), null, 2).split('\n').slice(0, 20).join('\n');
  }
  const header = columns.join(' | ');
  const separator = columns.map(() => '---').join('-|-');
  const rows = data.slice(0, 10).map((row) =>
    columns.map((col) => String(row[col] ?? '')).join(' | '),
  );
  return [header, separator, ...rows].join('\n');
}
