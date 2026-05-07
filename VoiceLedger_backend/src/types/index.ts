export type TransactionCategory =
  | '餐飲'
  | '交通'
  | '生活'
  | '購物'
  | '娛樂'
  | '醫療保健'
  | '其他';

export interface ParsedTransaction {
  description: string;
  amount: number;           // 支出為負，收入為正
  category: TransactionCategory;
  sub_category: string;
  merchant: string;
  transaction_date: string; // YYYY-MM-DD
}

// Telegraf session 暫存的待確認資料
export interface PendingSession {
  userId: string;           // profiles.id
  rawText: string;
  transcription: string;
  items: ParsedTransaction[];
}

export interface SessionData {
  pending?: PendingSession;
  awaitingCorrection?: boolean;
}

// Supabase transactions 表完整結構
export interface Transaction extends ParsedTransaction {
  id: string;
  user_id: string;
  raw_text: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  telegram_id: number | null;
  username: string | null;
  monthly_budget: number;
  created_at: string;
}
