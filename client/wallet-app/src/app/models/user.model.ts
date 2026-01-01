export interface User {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  walletBalance: number;
  totalCommissionEarned?: number;
  parentId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
