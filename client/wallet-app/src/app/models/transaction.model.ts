export interface Transaction {
  _id: string;
  type: 'credit' | 'debit' | 'commission' | 'recharge';
  amount: number;
  senderId?: string | null;
  receiverId: string;
  balanceAfter: number;
  commission?: number;
  description?: string;
  status: 'completed' | 'failed';
  createdAt: string;
  transactionType?: 'CREDIT' | 'DEBIT';
  sender?: {
    _id: string;
    username: string;
    email: string;
  } | null;
  receiver?: {
    _id: string;
    username: string;
    email: string;
  };
  timestamp?: string;
}