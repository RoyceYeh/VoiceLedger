export type TransactionCategory =
  | '餐飲'
  | '交通'
  | '生活'
  | '購物'
  | '娛樂'
  | '醫療保健'
  | '其他';

export interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;           // 支出為負，收入為正
  category: TransactionCategory;
  sub_category: string | null;
  merchant: string | null;
  raw_text: string | null;
  transaction_date: string; // YYYY-MM-DD
  created_at: string;
}

export interface Profile {
  id: string;
  telegram_id: number | null;
  username: string | null;
  monthly_budget: number;
  created_at: string;
}

export interface CategoryTotal {
  category: TransactionCategory;
  total: number;
  count: number;
}

export interface DailyExpense {
  transaction_date: string;
  total: number;
}

export interface MerchantStat {
  merchant: string;
  total: number;
  count: number;
}

export interface MonthlyBalance {
  month: string;     // YYYY-MM
  label: string;     // M月
  expense: number;   // 該月總支出（正數）
  remaining: number; // monthlyBudget - expense
}
