import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Chip,
  Divider,
  Snackbar,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  type SelectChangeEvent,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import ChatIcon from '@mui/icons-material/Chat';
import { useChat } from './controller';
import type { ChatMessage } from './controller';
import type { ExportFormat, Provider } from './model';
import { PROVIDERS, PROVIDER_MODELS } from './model';

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

  const handleFormatChange = useCallback(
    (e: SelectChangeEvent<ExportFormat>) => {
      setFormat(e.target.value as ExportFormat);
    },
    [setFormat],
  );

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', gap: 0 }}>
      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        variant="persistent"
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: 280, boxSizing: 'border-box', position: 'relative' },
        }}
      >
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>History</Typography>
          <Tooltip title="เริ่มแชทใหม่">
            <IconButton size="small" onClick={newSession}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Divider />
        <List dense>
          {sessions.map((s) => (
            <ListItemButton
              key={s.sessionId}
              selected={s.sessionId === sessionId}
              onClick={() => { void switchSession(s.sessionId); setSidebarOpen(false); }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <ChatIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={s.firstQuestion || '(empty)'}
                secondary={`${s.messageCount} msgs · ${new Date(s.lastActivity).toLocaleDateString('th')}`}
                primaryTypographyProps={{ noWrap: true, variant: 'body2' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItemButton>
          ))}
          {sessions.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              ยังไม่มีประวัติ
            </Typography>
          )}
        </List>
      </Drawer>

      <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Tooltip title="ประวัติแชท">
            <IconButton onClick={() => setSidebarOpen(!sidebarOpen)}>
              <HistoryIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            AI Chat
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="provider-label">Provider</InputLabel>
            <Select
              labelId="provider-label"
              value={provider}
              label="Provider"
              onChange={(e) => setProvider(e.target.value as Provider)}
            >
              {PROVIDERS.map((p) => (
                <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="model-label">Model</InputLabel>
            <Select
              labelId="model-label"
              value={model}
              label="Model"
              onChange={(e) => setModel(e.target.value)}
            >
              {(PROVIDER_MODELS[provider] || []).map((m) => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel id="format-label">Format</InputLabel>
            <Select
              labelId="format-label"
              value={format}
              label="Format"
              onChange={handleFormatChange}
            >
              <MenuItem value="text">Text</MenuItem>
              <MenuItem value="table">Table</MenuItem>
              <MenuItem value="html">HTML</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Export">
            <span>
              <IconButton
                onClick={() => void exportLastResult()}
                disabled={!messages.some((m) => m.role === 'assistant')}
              >
                <DownloadIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="เริ่มแชทใหม่">
            <IconButton onClick={newSession}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {error !== null && (
          <Alert severity="error" onClose={() => { setError(null); }} sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        <Snackbar
          open={toast.open}
          autoHideDuration={toast.persistent ? null : 6000}
          onClose={toast.persistent ? undefined : hideToast}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={toast.severity} onClose={hideToast} variant="filled" sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        </Snackbar>

        <Paper
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: 2,
            mb: 2,
            bgcolor: 'grey.50',
            borderRadius: 2,
          }}
        >
          {messages.length === 0 && !streaming.active && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography color="text.secondary">
                ถามคำถามเกี่ยวกับข้อมูลในระบบ เช่น &ldquo;วันนี้ยอดขายเท่าไหร่&rdquo; หรือ &ldquo;สินค้าใกล้หมดมีอะไรบ้าง&rdquo;
              </Typography>
            </Box>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onRetry={retrySend} />
          ))}

          {streaming.active && (
            <Box sx={{ mb: 2 }}>
              <StreamingIndicator state={streaming} format={format} />
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Paper>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="ถามคำถาม..."
            value={input}
            onChange={(e) => { setInput(e.target.value); }}
            onKeyDown={handleKeyDown}
            disabled={loading || streaming.active}
            size="small"
          />
          {loading || streaming.active ? (
            <IconButton color="error" onClick={cancelStream}>
              <CancelIcon />
            </IconButton>
          ) : (
            <IconButton color="primary" onClick={handleSend} disabled={!input.trim()}>
              <SendIcon />
            </IconButton>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function MessageBubble({ message, onRetry }: { message: ChatMessage; onRetry?: (question: string) => void }): React.ReactElement {
  const isUser = message.role === 'user';
  const isHtml = message.format === 'html' && !isUser;

  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 1.5 }}>
      <Paper
        sx={{
          maxWidth: '75%',
          p: 1.5,
          bgcolor: isUser ? 'primary.main' : message.isError ? 'warning.light' : 'background.paper',
          color: isUser ? 'primary.contrastText' : message.isError ? 'warning.contrastText' : 'text.primary',
          borderRadius: 2,
          borderTopRightRadius: isUser ? 0 : 2,
          borderTopLeftRadius: isUser ? 2 : 0,
          overflow: 'auto',
        }}
      >
        {isHtml ? (
          <Box
            sx={{
              '& table': { borderCollapse: 'collapse', width: '100%', fontSize: '0.8rem' },
              '& th, & td': { border: '1px solid #ccc', p: 0.5, textAlign: 'left' },
              '& th': { bgcolor: '#f5f5f5', fontWeight: 600 },
            }}
            dangerouslySetInnerHTML={{ __html: message.content }}
          />
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {message.content}
          </Typography>
        )}

        {message.isError && message.errorCode === 'SQL_TIMEOUT' && message.retryQuestion && onRetry && (
          <Box sx={{ mt: 1 }}>
            <Button size="small" variant="outlined" color="warning" startIcon={<AddIcon />}
              onClick={() => onRetry(message.retryQuestion!)} sx={{ textTransform: 'none' }}>
              ลองอีกครั้ง
            </Button>
          </Box>
        )}

        {message.sql && (
          <>
            <Divider sx={{ my: 1, borderColor: isUser ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.12)' }} />
            <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', opacity: 0.8, wordBreak: 'break-all' }}>
              SQL: {message.sql}
            </Typography>
          </>
        )}

        {message.resultCount !== undefined && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            <Chip label={`${message.resultCount} rows`} size="small" sx={{ opacity: 0.8, fontSize: '0.7rem' }} />
          </Box>
        )}
      </Paper>
    </Box>
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
    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
      <Paper sx={{
        maxWidth: '75%', p: 2, bgcolor: 'background.paper', borderRadius: 2, borderTopLeftRadius: 0,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            {state.sql ? 'Executing query...' : 'Generating SQL...'}
          </Typography>
        </Box>
        {state.sql && (
          <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace', color: 'text.secondary', wordBreak: 'break-all', mb: 1 }}>
            {state.sql}
          </Typography>
        )}
        {state.resultCount > 0 && (
          <>
            <Chip label={`${state.resultCount} rows so far`} size="small" sx={{ mb: 1 }} />
            <Box sx={{ maxHeight: 200, overflow: 'auto', fontSize: '0.75rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
              {formatPreview(state.data, format)}
            </Box>
          </>
        )}
      </Paper>
    </Box>
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
