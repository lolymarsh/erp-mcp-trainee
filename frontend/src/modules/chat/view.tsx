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
  type SelectChangeEvent,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import CancelIcon from '@mui/icons-material/Cancel';
import DeleteSweepIcon from '@mui/icons-material/ClearAll';
import { useChat } from './controller';
import type { ChatMessage } from './controller';
import type { ExportFormat } from './model';

export function ChatPanel(): React.ReactElement {
  const {
    messages,
    loading,
    error,
    streaming,
    format,
    messagesEndRef,
    setFormat,
    sendMessage,
    cancelStream,
    clearMessages,
    exportLastResult,
    setError,
  } = useChat();

  const [input, setInput] = useState('');

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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          AI Chat
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="format-label">Format</InputLabel>
          <Select
            labelId="format-label"
            value={format}
            label="Format"
            onChange={handleFormatChange}
          >
            <MenuItem value="text">Text</MenuItem>
            <MenuItem value="table">Table</MenuItem>
            <MenuItem value="csv">CSV</MenuItem>
            <MenuItem value="html">HTML</MenuItem>
            <MenuItem value="json">JSON</MenuItem>
          </Select>
        </FormControl>
        <Tooltip title="Export last result">
          <span>
            <IconButton
              onClick={() => void exportLastResult()}
              disabled={!messages.some((m) => m.role === 'assistant')}
            >
              <DownloadIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Clear chat">
          <IconButton onClick={clearMessages} disabled={messages.length === 0}>
            <DeleteSweepIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error !== null && (
        <Alert
          severity="error"
          onClose={() => {
            setError(null);
          }}
          sx={{ mb: 1 }}
        >
          {error}
        </Alert>
      )}

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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Typography color="text.secondary">
              ถามคำถามเกี่ยวกับข้อมูลในระบบ เช่น &ldquo;วันนี้ยอดขายเท่าไหร่&rdquo; หรือ &ldquo;สินค้าใกล้หมดมีอะไรบ้าง&rdquo;
            </Typography>
          </Box>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
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
          onChange={(e) => {
            setInput(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          disabled={loading || streaming.active}
          size="small"
        />
        {loading || streaming.active ? (
          <IconButton color="error" onClick={cancelStream}>
            <CancelIcon />
          </IconButton>
        ) : (
          <IconButton
            color="primary"
            onClick={handleSend}
            disabled={!input.trim()}
          >
            <SendIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}

function MessageBubble({ message }: { message: ChatMessage }): React.ReactElement {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
      }}
    >
      <Paper
        sx={{
          maxWidth: '75%',
          p: 1.5,
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          borderRadius: 2,
          borderTopRightRadius: isUser ? 0 : 2,
          borderTopLeftRadius: isUser ? 2 : 0,
        }}
      >
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </Typography>

        {message.sql && (
          <>
            <Divider sx={{ my: 1, borderColor: isUser ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.12)' }} />
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontFamily: 'monospace',
                opacity: 0.8,
                wordBreak: 'break-all',
              }}
            >
              SQL: {message.sql}
            </Typography>
          </>
        )}

        {message.resultCount !== undefined && (
          <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
            <Chip
              label={`${message.resultCount} rows`}
              size="small"
              sx={{ opacity: 0.8, fontSize: '0.7rem' }}
            />
            {message.cached === true && (
              <Chip
                label="cached"
                size="small"
                color="success"
                sx={{ fontSize: '0.7rem' }}
              />
            )}
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
      <Paper
        sx={{
          maxWidth: '75%',
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          borderTopLeftRadius: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <CircularProgress size={16} />
          <Typography variant="body2" color="text.secondary">
            {state.sql ? 'Executing query...' : 'Generating SQL...'}
          </Typography>
        </Box>

        {state.sql && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontFamily: 'monospace',
              color: 'text.secondary',
              wordBreak: 'break-all',
              mb: 1,
            }}
          >
            {state.sql}
          </Typography>
        )}

        {state.resultCount > 0 && (
          <>
            <Chip
              label={`${state.resultCount} rows so far`}
              size="small"
              sx={{ mb: 1 }}
            />
            <Box
              sx={{
                maxHeight: 200,
                overflow: 'auto',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
              }}
            >
              {formatPreview(state.data, format)}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

function formatPreview(data: Record<string, unknown>[], format: string): string {
  if (data.length === 0) {
    return '';
  }
  const columns = Object.keys(data[0]);
  if (format === 'json') {
    return JSON.stringify(data.slice(0, 5), null, 2)
      .split('\n')
      .slice(0, 20)
      .join('\n');
  }
  const header = columns.join(' | ');
  const separator = columns.map(() => '---').join('-|-');
  const rows = data
    .slice(0, 10)
    .map((row) => columns.map((col) => String(row[col] ?? '')).join(' | '));
  return [header, separator, ...rows].join('\n');
}
