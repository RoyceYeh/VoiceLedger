import { useState, useEffect } from 'react';
import {
  getCategoryTotals,
  getDailyExpenses,
  getWeeklyExpenses,
  getTopMerchants,
  getProfile,
  getMonthlyBalance,
} from '../api/queries.js';
import type { CategoryTotal, DailyExpense, MerchantStat, Profile, MonthlyBalance } from '../types/index.js';

export interface MonthlyStats {
  totalExpense: number;
  monthlyBudget: number;
  remaining: number;
  categoryTotals: CategoryTotal[];
  dailyExpenses: DailyExpense[];
  weeklyExpenses: DailyExpense[];
  topMerchants: MerchantStat[];
  monthlyBalance: MonthlyBalance[];
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

export function useMonthlyStats(year: number, month: number, refreshKey = 0): MonthlyStats {
  const [stats, setStats] = useState<MonthlyStats>({
    totalExpense: 0,
    monthlyBudget: 10000,
    remaining: 10000,
    categoryTotals: [],
    dailyExpenses: [],
    weeklyExpenses: [],
    topMerchants: [],
    monthlyBalance: [],
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    setStats((prev) => ({ ...prev, loading: true, error: null }));

    Promise.all([
      getCategoryTotals(year, month),
      getDailyExpenses(year, month),
      getWeeklyExpenses(),
      getTopMerchants(year, month),
      getProfile(),
    ])
      .then(([categoryTotals, dailyExpenses, weeklyExpenses, topMerchants, profile]) => {
        const totalExpense = categoryTotals.reduce((sum, c) => sum + c.total, 0);
        const monthlyBudget = profile?.monthly_budget ?? 10000;
        return getMonthlyBalance(monthlyBudget).then((monthlyBalance) => ({
          totalExpense,
          monthlyBudget,
          remaining: monthlyBudget - totalExpense,
          categoryTotals,
          dailyExpenses,
          weeklyExpenses,
          topMerchants,
          monthlyBalance,
          profile,
          loading: false,
          error: null,
        }));
      })
      .then((newStats) => setStats(newStats))
      .catch((err: Error) =>
        setStats((prev) => ({ ...prev, loading: false, error: err.message }))
      );
  }, [year, month, refreshKey]);

  return stats;
}
