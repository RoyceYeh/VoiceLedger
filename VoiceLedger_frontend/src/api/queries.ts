import { supabase } from '../lib/supabase.js';
import type { Transaction, Profile, CategoryTotal, DailyExpense, MerchantStat, MonthlyBalance } from '../types/index.js';

function monthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  return { start, end };
}

export async function getTransactionsByMonth(year: number, month: number): Promise<Transaction[]> {
  const { start, end } = monthRange(year, month);
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .gte('transaction_date', start)
    .lt('transaction_date', end)
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false });

  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function getCategoryTotals(year: number, month: number): Promise<CategoryTotal[]> {
  const { start, end } = monthRange(year, month);
  const { data, error } = await supabase
    .from('transactions')
    .select('category, amount')
    .gte('transaction_date', start)
    .lt('transaction_date', end)
    .lt('amount', 0); // 只計算支出

  if (error) throw error;

  const map: Record<string, { total: number; count: number }> = {};
  for (const row of data ?? []) {
    const cat = row.category as string;
    if (!map[cat]) map[cat] = { total: 0, count: 0 };
    map[cat].total += Math.abs(row.amount as number);
    map[cat].count += 1;
  }

  return Object.entries(map).map(([category, { total, count }]) => ({
    category: category as CategoryTotal['category'],
    total,
    count,
  }));
}

export async function getWeeklyExpenses(): Promise<DailyExpense[]> {
  const today = new Date();
  const end = today.toISOString().slice(0, 10);
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  const startStr = start.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_date, amount')
    .gte('transaction_date', startStr)
    .lte('transaction_date', end)
    .lt('amount', 0);

  if (error) throw error;

  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    const d = row.transaction_date as string;
    map[d] = (map[d] ?? 0) + Math.abs(row.amount as number);
  }

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([transaction_date, total]) => ({ transaction_date, total }));
}

export async function getDailyExpenses(year: number, month: number): Promise<DailyExpense[]> {
  const { start, end } = monthRange(year, month);
  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_date, amount')
    .gte('transaction_date', start)
    .lt('transaction_date', end)
    .lt('amount', 0);

  if (error) throw error;

  const map: Record<string, number> = {};
  for (const row of data ?? []) {
    const d = row.transaction_date as string;
    map[d] = (map[d] ?? 0) + Math.abs(row.amount as number);
  }

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([transaction_date, total]) => ({ transaction_date, total }));
}

export async function getTopMerchants(
  year: number,
  month: number,
  limit = 5
): Promise<MerchantStat[]> {
  const { start, end } = monthRange(year, month);
  const { data, error } = await supabase
    .from('transactions')
    .select('merchant, amount')
    .gte('transaction_date', start)
    .lt('transaction_date', end)
    .lt('amount', 0)
    .not('merchant', 'is', null)
    .neq('merchant', '');

  if (error) throw error;

  const map: Record<string, { total: number; count: number }> = {};
  for (const row of data ?? []) {
    const m = row.merchant as string;
    if (!map[m]) map[m] = { total: 0, count: 0 };
    map[m].total += Math.abs(row.amount as number);
    map[m].count += 1;
  }

  return Object.entries(map)
    .map(([merchant, { total, count }]) => ({ merchant, total, count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export async function getMonthlyBalance(
  monthlyBudget: number,
  months = 6,
): Promise<MonthlyBalance[]> {
  const now = new Date();
  const monthKeys: { key: string; label: string }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${d.getMonth() + 1}月`;
    monthKeys.push({ key, label });
  }

  const start = `${monthKeys[0].key}-01`;
  const [lastY, lastM] = monthKeys[monthKeys.length - 1].key.split('-').map(Number);
  const nextM = lastM === 12 ? 1 : lastM + 1;
  const nextY = lastM === 12 ? lastY + 1 : lastY;
  const end = `${nextY}-${String(nextM).padStart(2, '0')}-01`;

  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_date, amount')
    .gte('transaction_date', start)
    .lt('transaction_date', end)
    .lt('amount', 0);

  if (error) throw error;

  const expenseMap: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = (row.transaction_date as string).slice(0, 7);
    expenseMap[key] = (expenseMap[key] ?? 0) + Math.abs(row.amount as number);
  }

  return monthKeys.map(({ key, label }) => {
    const expense = expenseMap[key] ?? 0;
    return { month: key, label, expense, remaining: monthlyBudget - expense };
  });
}

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Profile | null;
}

export async function updateMonthlyBudget(id: string, budget: number): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ monthly_budget: budget })
    .eq('id', id);

  if (error) throw error;
}

export async function updateTelegramId(id: string, telegramId: number): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ telegram_id: telegramId })
    .eq('id', id);

  if (error) throw error;
}

export async function insertTransaction(
  userId: string,
  fields: {
    description: string;
    amount: number;
    category: Transaction['category'];
    sub_category: string | null;
    merchant: string | null;
    transaction_date: string;
  }
): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      description: fields.description,
      amount: fields.amount,
      category: fields.category,
      sub_category: fields.sub_category || null,
      merchant: fields.merchant || null,
      transaction_date: fields.transaction_date,
      raw_text: null,
    });
  if (error) throw error;
}

export async function updateTransaction(
  id: string,
  fields: Partial<Pick<Transaction, 'description' | 'amount' | 'category' | 'sub_category' | 'merchant' | 'transaction_date'>>
): Promise<void> {
  const { data, error } = await supabase.from('transactions').update(fields).eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('更新失敗：請至 Supabase 確認 transactions 表已設定 UPDATE policy。');
}

export async function deleteTransaction(id: string): Promise<void> {
  const { data, error } = await supabase.from('transactions').delete().eq('id', id).select('id');
  if (error) throw error;
  if (!data || data.length === 0) throw new Error('刪除失敗：請至 Supabase 確認 transactions 表已設定 DELETE policy。');
}
