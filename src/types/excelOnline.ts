export interface ExcelOnlineConfig {
  url: string;
  enabled: boolean;
  autoSync: boolean;
  lastSync: string | null;
  lastStatus: 'success' | 'error' | 'idle' | 'syncing';
  lastMessage: string | null;
  lastCount: number;
  syncIntervalSeconds?: number;
}

export interface ExcelOnlineSyncResult {
  success: boolean;
  message: string;
  statusCode?: number;
  syncedAt: string;
  count: number;
}
