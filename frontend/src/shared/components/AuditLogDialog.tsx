import React, { useEffect } from 'react';
import { History, Loader2 } from 'lucide-react';
import type { AuditLogDetailResponse } from '../../modules/audit/model';
import { useAuditHistory } from '../../modules/audit/controller';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

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

function getActionBadgeVariant(action: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (action) {
    case 'CREATE':
      return 'secondary';
    case 'UPDATE':
      return 'outline';
    case 'DELETE':
      return 'destructive';
    default:
      return 'default';
  }
}

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
    <div className="pb-3 mb-3 border-b border-neutral-200 dark:border-neutral-800 last:border-0 last:pb-0 last:mb-0">
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        <Badge
          variant={getActionBadgeVariant(log.action)}
          className={
            log.action === 'CREATE'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : ''
          }
        >
          {ACTION_LABELS[log.action] ?? log.action}
        </Badge>
        <span className="text-xs text-neutral-400">
          {formatDate(log.createdAt)}
        </span>
        {log.userDisplayName && (
          <span className="text-xs text-neutral-500 font-medium">
            โดย: {log.userDisplayName}
          </span>
        )}
      </div>

      {log.changeDatas.length === 0 ? (
        <p className="text-xs text-neutral-400 pl-2">
          ไม่มีการเปลี่ยนแปลง
        </p>
      ) : (
        <ul className="pl-4 space-y-1 my-1 text-xs font-mono">
          {log.changeDatas.map((change, idx) => (
            <li key={idx} className="flex flex-wrap items-baseline gap-1">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                {change.field}:
              </span>
              {log.action === 'CREATE' ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  {change.new || '-'}
                </span>
              ) : log.action === 'DELETE' ? (
                <span className="text-red-600 dark:text-red-400 line-through">
                  {change.old}
                </span>
              ) : (
                <>
                  <span className="text-red-500 line-through mr-1">
                    {change.old || '-'}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    → {change.new || '-'}
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {log.ipAddress && (
        <p className="text-[10px] text-neutral-400 pl-2 mt-1">
          IP: {log.ipAddress}
        </p>
      )}
    </div>
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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-4" />
            <span>ประวัติการแก้ไข{entityLabel ? ` — ${entityLabel}` : ''}</span>
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-8" role="progressbar">
            <Loader2 className="size-6 animate-spin text-neutral-500" />
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </div>
        )}

        {!loading && !error && logs.length === 0 && (
          <p className="py-8 text-center text-sm text-neutral-400">
            ไม่พบประวัติการแก้ไข
          </p>
        )}

        {!loading && (
          <div className="space-y-2 mt-2">
            {logs.map((log) => (
              <AuditLogEntry key={log._id} log={log} />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
