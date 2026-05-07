import { useState } from 'react';
import { motion } from 'motion/react';
import { Wallet, Edit2, Check, X, Bell } from 'lucide-react';
import { cn } from '../lib/utils.js';
import { updateMonthlyBudget, updateTelegramId } from '../api/queries.js';
import type { MonthlyStats } from '../hooks/useMonthlyStats.js';

const CATEGORY_COLORS: Record<string, string> = {
  餐飲: '#ff7f8b',
  交通: '#4cd7f6',
  生活: '#4edea3',
  購物: '#a78bfa',
  娛樂: '#fbbf24',
  醫療保健: '#34d399',
  其他: '#6b7280',
};

interface BudgetViewProps {
  stats: MonthlyStats;
  onRefresh: () => void;
}

export default function BudgetView({ stats, onRefresh }: BudgetViewProps) {
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const [showReminder, setShowReminder] = useState(
    () => localStorage.getItem('budgetReminderDismissed') !== currentMonth
  );

  const dismissReminder = () => {
    localStorage.setItem('budgetReminderDismissed', currentMonth);
    setShowReminder(false);
  };

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [editingTelegram, setEditingTelegram] = useState(false);
  const [telegramInput, setTelegramInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveBudget = async () => {
    if (!stats.profile) return;
    const value = parseInt(budgetInput, 10);
    if (isNaN(value) || value <= 0) return;
    setSaving(true);
    try {
      await updateMonthlyBudget(stats.profile.id, value);
      onRefresh();
      setEditingBudget(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTelegram = async () => {
    if (!stats.profile) return;
    const value = parseInt(telegramInput, 10);
    if (isNaN(value)) return;
    setSaving(true);
    try {
      await updateTelegramId(stats.profile.id, value);
      onRefresh();
      setEditingTelegram(false);
    } finally {
      setSaving(false);
    }
  };

  const burnPct = stats.monthlyBudget > 0
    ? Math.min(100, (stats.totalExpense / stats.monthlyBudget) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {showReminder && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 p-5 rounded-2xl border border-amber-400/30 bg-amber-400/5"
        >
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-sm text-amber-400">每月提醒</p>
              <p className="text-sm font-bold text-on-surface-variant mt-1">
                新的一個月開始了，確認本月預算是否需要調整。
              </p>
            </div>
          </div>
          <button
            onClick={dismissReminder}
            className="p-1 text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* 月預算設定 */}
      <div className="glass-panel p-8 rounded-2xl">
        <h3 className="font-black text-lg mb-6">月預算設定</h3>
        <div className="flex items-center gap-4">
          {editingBudget ? (
            <>
              <input
                type="number"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="輸入月預算"
                className="bg-surface-accent/20 border border-primary/50 rounded-xl px-4 py-3 text-on-surface font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 w-48"
                autoFocus
              />
              <button
                onClick={handleSaveBudget}
                disabled={saving}
                className="p-3 bg-primary/20 text-primary rounded-xl hover:bg-primary/30 transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => setEditingBudget(false)}
                className="p-3 bg-white/5 text-on-surface-variant rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-primary" />
                <span className="text-3xl font-black text-primary">
                  ${stats.monthlyBudget.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => {
                  setBudgetInput(String(stats.monthlyBudget));
                  setEditingBudget(true);
                }}
                className="p-3 bg-white/5 text-on-surface-variant rounded-xl hover:bg-white/10 hover:text-on-surface transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* 預算燃燒條 */}
        <div className="mt-8 space-y-3">
          <div className="flex justify-between text-sm font-bold">
            <span className="text-on-surface-variant">本月已使用</span>
            <span className={cn(burnPct > 80 ? 'text-error' : 'text-on-surface')}>
              {burnPct.toFixed(1)}%
            </span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${burnPct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={cn(
                'h-full rounded-full',
                burnPct > 90 ? 'bg-error' : burnPct > 70 ? 'bg-yellow-400' : 'bg-primary'
              )}
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-on-surface-variant">
            <span>已用 ${stats.totalExpense.toLocaleString()}</span>
            <span>剩餘 ${stats.remaining.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 各分類預算進度 */}
      <div className="glass-panel p-8 rounded-2xl">
        <h3 className="font-black text-lg mb-6">各類別支出</h3>
        <div className="space-y-5">
          {stats.categoryTotals.length === 0 ? (
            <p className="text-on-surface-variant text-sm font-bold">本月尚無支出記錄</p>
          ) : (
            stats.categoryTotals
              .sort((a, b) => b.total - a.total)
              .map((cat) => {
                const pct = stats.monthlyBudget > 0
                  ? Math.min(100, (cat.total / stats.monthlyBudget) * 100)
                  : 0;
                const color = CATEGORY_COLORS[cat.category] ?? '#6b7280';
                return (
                  <div key={cat.category} className="space-y-2">
                    <div className="flex justify-between text-sm font-bold">
                      <span>{cat.category}</span>
                      <span className="text-on-surface-variant">
                        ${cat.total.toLocaleString()} ({cat.count} 筆)
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Telegram ID 設定 */}
      <div className="glass-panel p-8 rounded-2xl">
        <h3 className="font-black text-lg mb-2">Telegram 綁定</h3>
        <p className="text-on-surface-variant text-sm font-bold mb-6">
          綁定後即可透過 Telegram Bot 語音記帳
        </p>
        <div className="flex items-center gap-4">
          {editingTelegram ? (
            <>
              <input
                type="number"
                value={telegramInput}
                onChange={(e) => setTelegramInput(e.target.value)}
                placeholder="輸入 Telegram ID"
                className="bg-surface-accent/20 border border-primary/50 rounded-xl px-4 py-3 text-on-surface font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 w-56"
                autoFocus
              />
              <button
                onClick={handleSaveTelegram}
                disabled={saving}
                className="p-3 bg-primary/20 text-primary rounded-xl hover:bg-primary/30 transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => setEditingTelegram(false)}
                className="p-3 bg-white/5 text-on-surface-variant rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <span className="font-mono font-bold text-on-surface">
                {stats.profile?.telegram_id
                  ? String(stats.profile.telegram_id)
                  : '尚未設定'}
              </span>
              <button
                onClick={() => {
                  setTelegramInput(String(stats.profile?.telegram_id ?? ''));
                  setEditingTelegram(true);
                }}
                className="p-3 bg-white/5 text-on-surface-variant rounded-xl hover:bg-white/10 hover:text-on-surface transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
        <p className="text-xs text-on-surface-variant mt-3 font-bold">
          在 Telegram Bot 傳送 /myid 指令可取得你的 ID
        </p>
      </div>
    </div>
  );
}
