import { supabase } from './supabase.service.js';
import type { ParsedTransaction, Profile } from '../types/index.js';

export async function getOrCreateProfile(telegramId: number, username: string): Promise<Profile> {
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (existing) return existing as Profile;

  const { data, error } = await supabase
    .from('profiles')
    .insert({ telegram_id: telegramId, username })
    .select()
    .single();

  if (error) throw new Error(`建立 profile 失敗：${error.message}`);
  return data as Profile;
}

export async function insertTransactions(
  userId: string,
  items: ParsedTransaction[],
  rawText: string,
): Promise<void> {
  const rows = items.map((item) => ({
    user_id: userId,
    description: item.description,
    amount: item.amount,
    category: item.category,
    sub_category: item.sub_category || null,
    merchant: item.merchant || null,
    raw_text: rawText,
    transaction_date: item.transaction_date,
  }));

  const { error } = await supabase.from('transactions').insert(rows);
  if (error) throw new Error(`寫入交易失敗：${error.message}`);
}

export interface MonthlySummary {
  month: string;         // YYYY-MM
  monthLabel: string;    // N月
  totalExpense: number;
  monthlyBudget: number;
  remaining: number;
  categoryTotals: { category: string; total: number }[];
}

export async function getMonthlySummaryByTelegramId(telegramId: number): Promise<MonthlySummary | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, monthly_budget')
    .eq('telegram_id', telegramId)
    .maybeSingle();

  if (!profile) return null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('transactions')
    .select('category, amount')
    .eq('user_id', (profile as { id: string }).id)
    .gte('transaction_date', start)
    .lt('transaction_date', end)
    .lt('amount', 0);

  if (error) throw new Error(`查詢摘要失敗：${error.message}`);

  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    const cat = row.category as string;
    map[cat] = (map[cat] ?? 0) + Math.abs(row.amount as number);
  }

  const categoryTotals = Object.entries(map)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  const totalExpense = categoryTotals.reduce((sum, c) => sum + c.total, 0);
  const monthlyBudget = (profile as { monthly_budget: number }).monthly_budget;

  return {
    month: `${year}-${String(month).padStart(2, '0')}`,
    monthLabel: `${year}年${month}月`,
    totalExpense,
    monthlyBudget,
    remaining: monthlyBudget - totalExpense,
    categoryTotals,
  };
}

export async function updateBudgetByTelegramId(telegramId: number, budget: number): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ monthly_budget: budget })
    .eq('telegram_id', telegramId);
  if (error) throw new Error(`更新預算失敗：${error.message}`);
}

export async function getBudgetByTelegramId(telegramId: number): Promise<number | null> {
  const { data } = await supabase
    .from('profiles')
    .select('monthly_budget')
    .eq('telegram_id', telegramId)
    .maybeSingle();
  return (data as { monthly_budget: number } | null)?.monthly_budget ?? null;
}
