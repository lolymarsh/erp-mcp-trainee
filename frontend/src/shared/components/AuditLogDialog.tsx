import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { AuditLogDetailResponse } from '../../modules/audit/model';
import { useAuditHistory } from '../../modules/audit/controller';

interface AuditLogDialogProps {
  open: boolean;
  onClose: () => void;
  tableName: string;
  recordId: string;
  entityLabel?: string;
}

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'สร้าง',
  UPDATE: 'แก้ไข',
  DELETE: 'ลบ',
};

const ACTION_COLORS: Record<string, 'success' | 'info' | 'error'> = {
  CREATE: 'success',
  UPDATE: 'info',
  DELETE: 'error',
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function AuditLogEntry({ log }: { log: AuditLogDetailResponse }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Chip
          label={ACTION_LABELS[log.action] ?? log.action}
          size="small"
          color={ACTION_COLORS[log.action] ?? 'default'}
          variant="filled"
        />
        <Typography variant="caption" color="text.secondary">
          {formatDate(log.createdAt)}
        </Typography>
        {log.userDisplayName && (
          <Typography variant="caption" color="text.secondary">
            โดย: {log.userDisplayName}
          </Typography>
        )}
      </Box>

      {log.changeDatas.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
          ไม่มีการเปลี่ยนแปลง
        </Typography>
      ) : (
        <Box component="ul" sx={{ m: 0, ml: 2, pl: 2 }}>
          {log.changeDatas.map((change, idx) => (
            <Box
              component="li"
              key={idx}
              sx={{
                mb: 0.5,
                typography: 'body2',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
              }}
            >
              <Typography
                component="span"
                variant="body2"
                sx={{ fontWeight: 600, mr: 1 }}
              >
                {change.field}:
              </Typography>
              {log.action === 'CREATE' ? (
                <Typography component="span" variant="body2" color="success.main">
                  {change.new || '-'}
                </Typography>
              ) : log.action === 'DELETE' ? (
                <Typography component="span" variant="body2" color="error.main">
                  {change.old}
                </Typography>
              ) : (
                <>
                  <Typography
                    component="span"
                    variant="body2"
                    color="error.main"
                    sx={{ textDecoration: 'line-through', mr: 1 }}
                  >
                    {change.old || '-'}
                  </Typography>
                  <Typography component="span" variant="body2" color="success.main">
                    → {change.new || '-'}
                  </Typography>
                </>
              )}
            </Box>
          ))}
        </Box>
      )}

      {log.ipAddress && (
        <Typography variant="caption" color="text.disabled" sx={{ ml: 2 }}>
          IP: {log.ipAddress}
        </Typography>
      )}

      <Divider sx={{ mt: 1 }} />
    </Box>
  );
}

export function AuditLogDialog({
  open,
  onClose,
  tableName,
  recordId,
  entityLabel,
}: AuditLogDialogProps): React.ReactElement {
  const { logs, loading, error, refetch } = useAuditHistory(tableName, recordId);

  useEffect(() => {
    if (open) {
      refetch();
    }
  }, [open, refetch]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            ประวัติการแก้ไข{entityLabel ? ` — ${entityLabel}` : ''}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && logs.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            ไม่พบประวัติการแก้ไข
          </Typography>
        )}

        {!loading &&
          logs.map((log) => <AuditLogEntry key={log._id} log={log} />)}
      </DialogContent>
    </Dialog>
  );
}
