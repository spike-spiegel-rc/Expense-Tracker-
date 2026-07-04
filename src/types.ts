export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type TransactionType = 'income' | 'expense';
export type PaymentMethod = 'cash' | 'bank';
export type VoucherStatus = 'active' | 'cancelled';
export type SyncStatus = 'synced' | 'pending_sync' | 'sync_failed';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  type: TransactionType;
  note: string;
  paymentMethod: PaymentMethod;
  status: VoucherStatus;
  syncStatus: SyncStatus;
  voucherNumber: string;
  voucherPrefix?: string;
  voucherSequence?: number | null;
  linkedLentId?: string;
  linkedBorrowedId?: string;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string | null;
  restoredAt?: string | null;
  cancelledByRecordType?: 'lent' | 'borrowed';
  cancelledByRecordId?: string;
}

export type RecordStatus = 'active' | 'cancelled';
export type RepaymentStatus = 'pending' | 'partial' | 'paid';

export interface LentBorrowedRecord {
  id: string;
  name: string;
  amount: number;
  date: string;
  dueDate: string | null;
  note: string;
  repaid: number;
  status: RepaymentStatus;
  recordStatus: RecordStatus;
  paymentMethod: PaymentMethod;
  recordCancelledAt?: string;
  recordRestoredAt?: string;
}

export interface Budget {
  [category: string]: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  userId: string;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}
