export type Role = 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';

export type AssetStatus = 'ACTIVE' | 'EXPIRED' | 'RENEWED_PENDING' | 'DONE' | 'CANCELLED';

export type NotificationStatus = 'PENDING' | 'SENT' | 'ACKNOWLEDGED' | 'FAILED';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  department?: Department;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  emailGroup?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoftwareAsset {
  id: string;
  stt?: number;
  name: string;
  costYear?: number;
  currency: string;
  budgetYear?: number;
  departmentId?: string;
  department?: Department;
  expireDate: string;
  note?: string;
  need3MonthReminder: boolean;
  status: AssetStatus;
  responsibleUserId?: string;
  responsibleUser?: User;
  vendorName?: string;
  contractNumber?: string;
  licenseType?: string;
  quantity?: number;
  nextExpireDate?: string;
  createdAt: string;
  updatedAt: string;
  renewalHistory?: RenewalHistory[];
}

export interface RenewalHistory {
  id: string;
  softwareAssetId: string;
  actionDate: string;
  actionType: 'RENEW' | 'CANCEL' | 'EXTEND' | 'UPDATE_INFO';
  oldExpireDate?: string;
  newExpireDate?: string;
  cost?: number;
  performedByUserId: string;
  performedBy?: User;
  note?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  softwareAssetId: string;
  softwareAsset?: SoftwareAsset;
  type: 'UPCOMING_EXPIRY' | 'EXPIRED' | 'CUSTOM';
  remindBeforeDays: number;
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string;
  emailSubject?: string;
  emailTo?: string;
  emailCc?: string;
  errorMessage?: string;
}

export interface ImportJob {
  id: string;
  fileName: string;
  uploadedByUserId: string;
  uploadedBy?: User;
  uploadedAt: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'PARTIAL';
  errorLog?: string;
  details?: ImportJobDetail[];
}

export interface ImportJobDetail {
  id: string;
  importJobId: string;
  rowNumber: number;
  rawData?: string;
  status: string;
  errorMessage?: string;
}

export interface DashboardSummary {
  summary: {
    totalAssets: number;
    expiringSoon: number;
    expired: number;
    renewedThisMonth: number;
  };
  assetsByStatus: Array<{
    status: AssetStatus;
    count: number;
  }>;
  assetsByDepartment: Array<{
    department: string;
    count: number;
    totalCost: number;
  }>;
  expiringByMonth: Array<{
    month: string;
    count: number;
  }>;
  upcomingExpiry: SoftwareAsset[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
