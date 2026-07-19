export interface ChangeModel {
  field: string;
  old: string;
  new: string;
}

export interface AuditLogDocument {
  _id: string;
  action: string;
  tableName: string;
  recordId: string;
  changeDatas: ChangeModel[];
  userId: string;
  userDisplayName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: Date;
}
