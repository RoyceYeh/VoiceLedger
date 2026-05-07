import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  LineChart as LineChartIcon,
  Receipt,
  Wallet,
  BarChart3,
  Plus,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  Settings,
  Menu,
  X,
  TrendingUp,
  MoreHorizontal,
  Calendar,
  Filter,
  Edit2,
  Trash2,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  Bot,
  Utensils,
  Car,
  Gamepad2,
  FileText,
  ShoppingBag,
  Heart,
  Home,
  HelpCircle as OtherIcon,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  LabelList,
  ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils.js';
import { useAuth } from './hooks/useAuth.js';
import { useTransactions } from './hooks/useTransactions.js';
import { useMonthlyStats } from './hooks/useMonthlyStats.js';
import LoginPage from './components/LoginPage.js';
import BudgetView from './components/BudgetView.js';
import type { Transaction, TransactionCategory, CategoryTotal, DailyExpense, MerchantStat, MonthlyBalance } from './types/index.js';
import { updateTransaction, deleteTransaction, insertTransaction } from './api/queries.js';
import { supabase } from './lib/supabase.js';

// --- Types ---
type Tab = 'overview' | 'analytics' | 'transactions' | 'budget' | 'reports';

// --- 類別顏色映射 ---
const CATEGORY_COLORS: Record<string, string> = {
  餐飲: '#ff7f8b',
  交通: '#4cd7f6',
  生活: '#4edea3',
  購物: '#a78bfa',
  娛樂: '#fbbf24',
  醫療保健: '#34d399',
  其他: '#6b7280',
};

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  餐飲: Utensils,
  交通: Car,
  生活: Home,
  購物: ShoppingBag,
  娛樂: Gamepad2,
  醫療保健: Heart,
  其他: OtherIcon,
};

// --- Components ---

const SidebarItem = ({
  icon: Icon,
  label,
  active = false,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      'w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 group cursor-pointer text-left',
      active
        ? 'bg-primary/15 text-primary border-r-2 border-primary'
        : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
    )}
  >
    <Icon className={cn('w-5 h-5 mr-3 group-hover:scale-110 transition-transform')} />
    <span className="font-bold text-sm">{label}</span>
  </button>
);

const MetricCard = ({
  title,
  value,
  change,
  positive,
  colorClass,
  loading,
}: {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  colorClass: string;
  loading?: boolean;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-panel p-6 rounded-2xl flex flex-col justify-between group hover:border-white/20 transition-all duration-300"
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-on-surface-variant text-sm font-bold mb-1 opacity-70">{title}</p>
        {loading ? (
          <div className="h-9 w-32 bg-white/10 rounded-lg animate-pulse" />
        ) : (
          <h3 className={cn('text-3xl font-black tracking-tight', colorClass)}>{value}</h3>
        )}
      </div>
    </div>
    <div className={cn('flex items-center text-xs font-bold', positive ? 'text-secondary' : 'text-error')}>
      <TrendingUp className="w-3 h-3 mr-1" />
      <span>{change}</span>
    </div>
  </motion.div>
);

const TypingText = ({ text }: { text: string }) => {
  const characters = Array.from(text);
  return (
    <motion.div className="inline-block text-on-surface font-medium leading-relaxed max-w-3xl text-lg">
      {characters.map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1, delay: index * 0.03 }}
        >
          {char}
        </motion.span>
      ))}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        className="inline-block w-2 h-5 bg-primary ml-1 align-middle"
      />
    </motion.div>
  );
};

// --- Content Views ---

const OverviewView = ({
  totalExpense,
  monthlyBudget,
  remaining,
  categoryTotals,
  weeklyExpenses,
  loading,
}: {
  totalExpense: number;
  monthlyBudget: number;
  remaining: number;
  categoryTotals: CategoryTotal[];
  weeklyExpenses: DailyExpense[];
  loading: boolean;
}) => {
  const structureData = categoryTotals.map((c) => ({
    name: c.category,
    value: c.total,
    color: CATEGORY_COLORS[c.category] ?? '#6b7280',
  }));

  const totalCat = structureData.reduce((s, c) => s + c.value, 0);
  const topCategory = structureData.sort((a, b) => b.value - a.value)[0]?.name ?? '—';

  const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];
  const today = new Date();
  const trendsData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const found = weeklyExpenses.find((exp) => exp.transaction_date === dateStr);
    return { name: `週${dayLabels[d.getDay()]}`, value: found?.total ?? 0 };
  });

  const burnPct = monthlyBudget > 0 ? ((totalExpense / monthlyBudget) * 100).toFixed(0) : '0';

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="本月支出"
          value={`$${totalExpense.toLocaleString()}`}
          change="實際消費金額"
          positive={false}
          colorClass="text-error"
          loading={loading}
        />
        <MetricCard
          title="本月預算"
          value={`$${monthlyBudget.toLocaleString()}`}
          change="可至預算管理修改"
          positive={true}
          colorClass="text-secondary"
          loading={loading}
        />
        <MetricCard
          title="預算餘額"
          value={`$${remaining.toLocaleString()}`}
          change={`${burnPct}% 已使用`}
          positive={remaining >= 0}
          colorClass={remaining >= 0 ? 'text-primary' : 'text-error'}
          loading={loading}
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-lg">近一週支出</h3>
            <button className="p-2 hover:bg-white/5 rounded-lg text-on-surface-variant">
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="flex-1">
            {loading ? (
              <div className="h-full bg-white/5 rounded-xl animate-pulse" />
            ) : trendsData.every((d) => d.value === 0) ? (
              <div className="flex items-center justify-center h-full text-on-surface-variant font-bold text-sm">
                近一週尚無支出記錄
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendsData} margin={{ top: 28, right: 4, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#bcc9cd', fontSize: 11, fontWeight: 700 }}
                    dy={8}
                  />
                  <YAxis hide domain={[0, (dataMax: number) => Math.max(dataMax * 1.45, 100)]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171f33', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#06b6d4', fontWeight: 700 }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, '支出']}
                  />
                  <Bar dataKey="value" fill="#06b6d4" radius={[6, 6, 0, 0]} maxBarSize={52}>
                    <LabelList
                      dataKey="value"
                      position="top"
                      formatter={(v: number) => v > 0 ? `$${v.toLocaleString()}` : ''}
                      style={{ fill: '#bcc9cd', fontSize: 10, fontWeight: 700 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h3 className="font-black text-lg mb-6">支出結構</h3>
          {loading ? (
            <div className="flex-1 bg-white/5 rounded-xl animate-pulse" />
          ) : structureData.length === 0 ? (
            <div className="flex items-center justify-center flex-1 text-on-surface-variant font-bold text-sm">
              本月尚無支出記錄
            </div>
          ) : (
            <>
              <div className="h-48 relative mb-8">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={structureData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value">
                      {structureData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-on-surface-variant font-black uppercase opacity-50">主流</span>
                  <span className="font-black text-xl text-primary">{topCategory}</span>
                </div>
              </div>
              <div className="space-y-4">
                {structureData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-bold text-on-surface-variant">{item.name}</span>
                    </div>
                    <span className="font-black">
                      {totalCat > 0 ? ((item.value / totalCat) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 分類支出排行 */}
      <section className="glass-panel p-8 rounded-2xl space-y-6">
        <h3 className="font-black text-lg text-error">「血汗錢去哪了」排行榜</h3>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : categoryTotals.length === 0 ? (
          <p className="text-on-surface-variant font-bold text-sm">本月尚無支出記錄</p>
        ) : (
          [...categoryTotals]
            .sort((a, b) => b.total - a.total)
            .map((cat) => {
              const Icon = CATEGORY_ICONS[cat.category] ?? CATEGORY_ICONS['其他'];
              const color = CATEGORY_COLORS[cat.category] ?? '#6b7280';
              const maxTotal = Math.max(...categoryTotals.map((c) => c.total));
              return (
                <div key={cat.category} className="flex items-center gap-4 group">
                  <div
                    className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-colors"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-1">
                      <h4 className="font-bold text-sm">{cat.category}</h4>
                      <span className="font-black text-sm text-error">-${cat.total.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(cat.total / maxTotal) * 100}%` }}
                          transition={{ duration: 1.5 }}
                          className="h-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                      <span className="text-[10px] font-black text-on-surface-variant">{cat.count} 筆</span>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </section>
    </div>
  );
};

const AnalyticsView = ({
  categoryTotals,
  topMerchants,
  monthlyBudget,
  totalExpense,
  monthlyBalance,
  transactions,
  loading,
}: {
  categoryTotals: CategoryTotal[];
  topMerchants: MerchantStat[];
  monthlyBudget: number;
  totalExpense: number;
  monthlyBalance: MonthlyBalance[];
  transactions: Transaction[];
  loading: boolean;
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const BURN_RATE_DATA = useMemo(() => {
    const today = new Date().getDate();
    return Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      ideal: Math.round((monthlyBudget / 30) * (i + 1)),
      actual: i < today ? Math.round((totalExpense / today) * (i + 1)) : null,
    }));
  }, [monthlyBudget, totalExpense]);

  const categoryOptions = categoryTotals.map((c) => c.category);

  const subCategoryData = useMemo(() => {
    if (!selectedCategory) return [];
    const map: Record<string, { total: number; count: number }> = {};
    for (const tx of transactions) {
      if (tx.category !== selectedCategory || tx.amount >= 0) continue;
      const key = tx.sub_category || '未分類';
      if (!map[key]) map[key] = { total: 0, count: 0 };
      map[key].total += Math.abs(tx.amount);
      map[key].count += 1;
    }
    return Object.entries(map)
      .map(([name, { total, count }]) => ({ name, total, count }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* AI 摘要 */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-8 rounded-2xl relative overflow-hidden bg-gradient-to-br from-surface-card to-surface-accent/20"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 right-0 p-8"
        >
          <Bot size={100} className="text-primary" />
        </motion.div>
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            animate={{ boxShadow: ['0 0 0px var(--color-primary)', '0 0 15px var(--color-primary)', '0 0 0px var(--color-primary)'] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="p-2 bg-primary/20 rounded-lg text-primary"
          >
            <Bot size={20} />
          </motion.div>
          <h3 className="font-black text-xl">AI 財務健康摘要</h3>
        </div>
        {loading ? (
          <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
        ) : (
          <TypingText
            text={
              totalExpense === 0
                ? '本月尚無支出記錄。開始透過 Telegram Bot 記錄你的第一筆消費吧！'
                : `本月已支出 $${totalExpense.toLocaleString()}，預算使用率 ${monthlyBudget > 0 ? ((totalExpense / monthlyBudget) * 100).toFixed(0) : 0}%。` +
                  (categoryTotals.length > 0
                    ? `最大支出類別為「${categoryTotals.sort((a, b) => b.total - a.total)[0].category}」，佔總支出 ${((categoryTotals[0].total / totalExpense) * 100).toFixed(0)}%。`
                    : '')
            }
          />
        )}
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 預算燃燒圖 */}
        <section className="glass-panel p-8 rounded-2xl flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-black text-lg">預算燃燒圖 (Burn Rate)</h3>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase opacity-50">Spending Velocity</p>
            </div>
          </div>
          <div className="h-64 mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={BURN_RATE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="day" ticks={[5, 10, 15, 20, 25, 30]} interval={0} axisLine={false} tickLine={false} tick={{ fill: '#bcc9cd', fontSize: 10, fontWeight: 700 }} />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#171f33', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="ideal" stroke="#3d494c" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="actual" stroke="#06b6d4" strokeWidth={4} dot={{ r: 4, fill: '#06b6d4', strokeWidth: 0 }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 類別分析 */}
        <section className="glass-panel p-8 rounded-2xl flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h3 className="font-black text-lg">
                {selectedCategory ?? '類別分析'}
              </h3>
            </div>
            <div className="relative">
              <select
                value={selectedCategory ?? ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="appearance-none bg-surface-accent/20 border border-outline hover:border-primary/50 text-on-surface text-sm font-bold rounded-xl px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-pointer"
              >
                <option value="" className="bg-surface-card text-on-surface">選擇類別</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat} className="bg-surface-card text-on-surface">{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            {loading ? (
              <div className="w-full h-full bg-white/5 rounded-xl animate-pulse" />
            ) : categoryTotals.length === 0 ? (
              <p className="text-sm font-bold text-on-surface-variant/50">本月尚無支出資料</p>
            ) : selectedCategory ? (
              <div className="w-full space-y-4">
                {/* 類別總計 */}
                {categoryTotals.filter((c) => c.category === selectedCategory).map((cat) => (
                  <div key={cat.category} className="p-4 bg-surface-accent/30 rounded-xl flex justify-between items-center">
                    <div>
                      <p className="text-xs font-black text-on-surface-variant uppercase mb-1">{cat.category}</p>
                      <p className="text-2xl font-black text-error">${cat.total.toLocaleString()}</p>
                    </div>
                    <span className="text-sm font-bold text-on-surface-variant">{cat.count} 筆</span>
                  </div>
                ))}
                {/* 子分類明細 */}
                {subCategoryData.length === 0 ? (
                  <p className="text-sm text-on-surface-variant/50 text-center py-4 font-bold">無子分類資料</p>
                ) : (
                  <div className="space-y-3">
                    {subCategoryData.map((item) => {
                      const catTotal = categoryTotals.find((c) => c.category === selectedCategory)?.total ?? 1;
                      const pct = (item.total / catTotal) * 100;
                      return (
                        <div key={item.name} className="flex items-center gap-3 group">
                          <div className="flex-1">
                            <div className="flex justify-between items-end mb-1">
                              <span className="font-bold text-sm">{item.name}</span>
                              <span className="font-black text-sm text-error">-${item.total.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 1 }}
                                  className="h-full bg-primary"
                                />
                              </div>
                              <span className="text-[10px] font-black text-on-surface-variant">{item.count} 筆</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full space-y-3">
                {CATEGORIES.map((cat) => {
                  const data = categoryTotals.find((c) => c.category === cat);
                  return (
                    <div
                      key={cat}
                      onClick={() => { if (data) setSelectedCategory(cat); }}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl transition-colors',
                        data ? 'hover:bg-white/5 cursor-pointer' : 'opacity-35 cursor-default'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                        <span className="font-bold text-sm">{cat}</span>
                      </div>
                      <span className="font-black text-sm text-error">
                        {data ? `$${data.total.toLocaleString()}` : '$0'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 資產累積圖 */}
      <section className="glass-panel p-8 rounded-2xl flex flex-col">
        <div className="mb-6">
          <h3 className="font-black text-lg">資產累積圖</h3>
          <p className="text-[10px] text-on-surface-variant font-bold uppercase opacity-50">近六個月每月預算餘額</p>
        </div>
        <div className="h-64">
          {loading ? (
            <div className="h-full bg-white/5 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyBalance}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#bcc9cd', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                  padding={{ left: 24, right: 24 }}
                />
                <YAxis hide domain={[0, (dataMax: number) => Math.max(dataMax * 1.2, 1)]} />
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#171f33', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, '餘額']}
                  labelStyle={{ color: '#bcc9cd', fontWeight: 700, marginBottom: 4 }}
                />
                <Area
                  type="monotone"
                  dataKey="remaining"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#balanceGradient)"
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

    </div>
  );
};

interface EditForm {
  description: string;
  amount: string;
  category: TransactionCategory;
  sub_category: string;
  merchant: string;
  transaction_date: string;
}

const CATEGORIES: TransactionCategory[] = ['餐飲', '交通', '生活', '購物', '娛樂', '醫療保健', '其他'];

const TransactionsView = ({
  transactions,
  loading,
  error,
  onRefresh,
}: {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) => {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditError(null);
    setEditForm({
      description: tx.description,
      amount: String(Math.abs(tx.amount)),
      category: tx.category,
      sub_category: tx.sub_category ?? '',
      merchant: tx.merchant ?? '',
      transaction_date: tx.transaction_date,
    });
  };

  const saveEdit = async () => {
    if (!editingTx || !editForm) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const sign = editingTx.amount <= 0 ? -1 : 1;
      await updateTransaction(editingTx.id, {
        description: editForm.description,
        amount: sign * parseFloat(editForm.amount),
        category: editForm.category,
        sub_category: editForm.sub_category || null,
        merchant: editForm.merchant || null,
        transaction_date: editForm.transaction_date,
      });
      setEditingTx(null);
      setEditForm(null);
      onRefresh();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : '儲存失敗，請再試一次。');
    } finally {
      setEditSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteTransaction(deletingId);
      setDeletingId(null);
      onRefresh();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '刪除失敗，請再試一次。');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        !search ||
        tx.description.includes(search) ||
        (tx.merchant ?? '').includes(search);
      const matchCategory = !filterCategory || tx.category === filterCategory;
      const matchStart = !startDate || tx.transaction_date >= startDate;
      const matchEnd = !endDate || tx.transaction_date <= endDate;
      return matchSearch && matchCategory && matchStart && matchEnd;
    });
  }, [transactions, search, filterCategory, startDate, endDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-surface-card p-6 rounded-2xl border border-white/5 shadow-xl glass-panel">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜尋交易、商家..."
            className="w-full bg-surface-accent/20 border border-outline rounded-xl pl-12 pr-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-on-surface transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">
          {/* 日期區間 */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-on-surface-variant shrink-0" />
            <input
              type="date"
              value={startDate}
              max={endDate || new Date().toISOString().slice(0, 10)}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-surface-accent/20 border border-outline hover:border-primary/50 text-on-surface text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-pointer [color-scheme:dark]"
            />
            <span className="text-on-surface-variant font-bold text-sm">—</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-surface-accent/20 border border-outline hover:border-primary/50 text-on-surface text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-pointer [color-scheme:dark]"
            />
          </div>

          {/* 分類篩選 */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="appearance-none bg-surface-accent/20 border border-outline hover:border-primary/50 text-on-surface text-sm font-bold rounded-xl px-5 py-3 pr-10 focus:outline-none cursor-pointer transition-colors"
            >
              <option value="">全部分類</option>
              {['餐飲', '交通', '生活', '購物', '娛樂', '醫療保健', '其他'].map((c) => (
                <option key={c} value={c} className="bg-surface-card">{c}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 編輯 Modal */}
      {editingTx && editForm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-2xl p-8 w-full max-w-md"
          >
            <h3 className="font-black text-lg mb-6">編輯交易</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-on-surface-variant uppercase mb-2 block">日期</label>
                <input
                  type="date"
                  value={editForm.transaction_date}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setEditForm({ ...editForm, transaction_date: e.target.value })}
                  className="w-full bg-surface-accent/20 border border-outline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs font-black text-on-surface-variant uppercase mb-2 block">項目說明</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-surface-accent/20 border border-outline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-xs font-black text-on-surface-variant uppercase mb-2 block">金額</label>
                <input
                  type="number"
                  value={editForm.amount}
                  min="0"
                  step="1"
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full bg-surface-accent/20 border border-outline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-xs font-black text-on-surface-variant uppercase mb-2 block">分類</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value as TransactionCategory })}
                  className="w-full appearance-none bg-surface-accent/20 border border-outline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-surface-card">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-on-surface-variant uppercase mb-2 block">商家</label>
                <input
                  type="text"
                  value={editForm.merchant}
                  onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })}
                  className="w-full bg-surface-accent/20 border border-outline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            {editError && (
              <p className="mt-4 text-xs font-bold text-error bg-error/10 rounded-xl px-4 py-3">{editError}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setEditingTx(null); setEditForm(null); setEditError(null); }}
                className="flex-1 py-3 rounded-xl border border-outline text-on-surface-variant font-bold text-sm hover:bg-white/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={saveEdit}
                disabled={editSaving}
                className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary/80 transition-colors disabled:opacity-50"
              >
                {editSaving ? '儲存中...' : '儲存'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 刪除確認 Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel rounded-2xl p-8 w-full max-w-sm text-center"
          >
            <div className="w-12 h-12 rounded-full bg-error/20 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-error" />
            </div>
            <h3 className="font-black text-lg mb-2">確認刪除</h3>
            <p className="text-sm text-on-surface-variant font-bold mb-4">此操作無法復原</p>
            {deleteError && (
              <p className="mb-4 text-xs font-bold text-error bg-error/10 rounded-xl px-4 py-3">{deleteError}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-3 rounded-xl border border-outline text-on-surface-variant font-bold text-sm hover:bg-white/5 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 py-3 rounded-xl bg-error text-white font-bold text-sm hover:bg-error/80 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? '刪除中...' : '刪除'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="glass-panel rounded-2xl overflow-hidden shadow-xl border border-white/5">
        {error ? (
          <div className="p-12 text-center text-error font-bold">載入失敗：{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-accent/30 text-on-surface-variant text-xs uppercase tracking-wider font-black border-b border-white/5">
                  <th className="px-6 py-5 whitespace-nowrap">日期</th>
                  <th className="px-6 py-5 whitespace-nowrap">分類</th>
                  <th className="px-6 py-5 whitespace-nowrap">項目說明</th>
                  <th className="px-6 py-5 whitespace-nowrap">商家</th>
                  <th className="px-6 py-5 text-right whitespace-nowrap">金額</th>
                  <th className="px-6 py-5 text-right w-24">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-5">
                          <div className="h-4 bg-white/5 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant font-bold">
                      {transactions.length === 0 ? '本月尚無交易記錄' : '沒有符合條件的結果'}
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence>
                    {filtered.map((tx, idx) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="font-bold text-sm text-on-surface">{tx.transaction_date}</div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span
                            className="px-3 py-1.5 rounded-lg text-xs font-black tracking-wider border inline-block"
                            style={{
                              backgroundColor: `${CATEGORY_COLORS[tx.category]}18`,
                              color: CATEGORY_COLORS[tx.category],
                              borderColor: `${CATEGORY_COLORS[tx.category]}30`,
                            }}
                          >
                            {tx.category}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-bold text-sm text-on-surface truncate max-w-[200px]">
                            {tx.description}
                          </div>
                          {tx.sub_category && (
                            <div className="text-[10px] text-on-surface-variant mt-0.5">{tx.sub_category}</div>
                          )}
                        </td>
                        <td className="px-6 py-5 text-on-surface-variant text-sm font-bold">
                          {tx.merchant || '—'}
                        </td>
                        <td className="px-6 py-5 text-right whitespace-nowrap">
                          <span
                            className={cn(
                              'font-black text-sm',
                              tx.amount < 0 ? 'text-error' : 'text-secondary'
                            )}
                          >
                            {tx.amount < 0
                              ? `-$${Math.abs(tx.amount).toLocaleString()}`
                              : `+$${tx.amount.toLocaleString()}`}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => openEdit(tx)}
                              className="p-2 hover:bg-primary/10 text-on-surface-variant hover:text-primary rounded-xl transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(tx.id)}
                              className="p-2 hover:bg-error/10 text-on-surface-variant hover:text-error rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(
    () => (localStorage.getItem('activeTab') as Tab) ?? 'overview'
  );

  const switchTab = (tab: Tab) => {
    localStorage.setItem('activeTab', tab);
    setActiveTab(tab);
    setSidebarOpen(false);
  };
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const [txRefreshKey, setTxRefreshKey] = useState(0);

  const emptyAddForm = (): EditForm => ({
    description: '',
    amount: '',
    category: '餐飲',
    sub_category: '',
    merchant: '',
    transaction_date: new Date().toISOString().slice(0, 10),
  });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState<EditForm>(emptyAddForm);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const openAddModal = () => {
    setAddForm(emptyAddForm());
    setAddError(null);
    setAddModalOpen(true);
  };

  const saveAdd = async () => {
    if (!user) return;
    const amount = parseFloat(addForm.amount);
    if (!addForm.description.trim() || isNaN(amount) || amount <= 0) {
      setAddError('請填寫說明與有效金額。');
      return;
    }
    setAddSaving(true);
    setAddError(null);
    try {
      await insertTransaction(user.id, {
        description: addForm.description,
        amount: -amount,
        category: addForm.category,
        sub_category: addForm.sub_category || null,
        merchant: addForm.merchant || null,
        transaction_date: addForm.transaction_date,
      });
      setAddModalOpen(false);
      setTxRefreshKey((k) => k + 1);
      setStatsRefreshKey((k) => k + 1);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : '新增失敗，請再試一次。');
    } finally {
      setAddSaving(false);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel('transactions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        setStatsRefreshKey((k) => k + 1);
        setTxRefreshKey((k) => k + 1);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const stats = useMonthlyStats(year, month, statsRefreshKey);
  const { transactions, loading: txLoading, error: txError } = useTransactions(txRefreshKey);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={signInWithGoogle} />;
  }

  const getTitle = () => {
    switch (activeTab) {
      case 'overview': return '總覽';
      case 'analytics': return '分析中心';
      case 'transactions': return '交易明細';
      case 'budget': return '預算管理';
      default: return '總覽';
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            key="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 glass-panel border-r-0 transition-all duration-300 transform md:translate-x-0 shadow-2xl',
        !isSidebarOpen && '-translate-x-full'
      )}>
        <div className="flex flex-col h-full py-10">
          <div className="px-8 mb-12 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40">
              <Wallet className="text-on-primary w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tighter">VoiceLedger</h1>
              <p className="text-[10px] uppercase tracking-widest text-primary font-black opacity-80">AI 語音記帳</p>
            </div>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <SidebarItem icon={LayoutDashboard} label="總覽" active={activeTab === 'overview'} onClick={() => switchTab('overview')} />
            <SidebarItem icon={BarChart3} label="分析" active={activeTab === 'analytics'} onClick={() => switchTab('analytics')} />
            <SidebarItem icon={Receipt} label="交易明細" active={activeTab === 'transactions'} onClick={() => switchTab('transactions')} />
            <SidebarItem icon={Wallet} label="預算管理" active={activeTab === 'budget'} onClick={() => switchTab('budget')} />
          </nav>
          <div className="px-6 mt-8">
            <button
              onClick={openAddModal}
              className="w-full bg-primary hover:bg-primary/80 text-on-primary font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Plus size={20} />
              <span>新增消費</span>
            </button>
          </div>
          <div className="mt-12 px-4 space-y-1 border-t border-white/5 pt-8">
            <SidebarItem icon={HelpCircle} label="幫助中心" />
            <SidebarItem icon={LogOut} label="安全登出" onClick={signOut} />
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="h-20 glass-panel border-x-0 border-t-0 flex items-center justify-between px-10 sticky top-0 z-40 backdrop-blur-2xl">
          <div className="flex items-center gap-6 flex-1">
            <button
              className="md:hidden p-2 text-on-surface-variant hover:text-on-surface"
              onClick={() => setSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
            <h2 className="text-xl font-black tracking-tight hidden lg:block">{getTitle()}</h2>
          </div>
          <div className="flex items-center gap-6">
            <button className="p-3 hover:bg-white/5 rounded-2xl relative">
              <Bell size={22} className="text-on-surface-variant" />
            </button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 p-1.5 hover:bg-white/5 rounded-2xl transition-all cursor-pointer group"
            >
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url as string}
                  alt="User"
                  className="w-10 h-10 rounded-2xl object-cover shadow-xl"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary font-black">
                  {(user.user_metadata?.full_name as string ?? user.email ?? 'U')[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm font-bold text-on-surface-variant hidden xl:block">
                {(user.user_metadata?.full_name as string) ?? user.email}
              </span>
            </motion.div>
          </div>
        </header>

        {/* 新增消費 Modal */}
        {addModalOpen && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel rounded-2xl p-8 w-full max-w-md"
            >
              <h3 className="font-black text-lg mb-6">新增消費</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-on-surface-variant uppercase mb-2 block">日期</label>
                  <input
                    type="date"
                    value={addForm.transaction_date}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setAddForm({ ...addForm, transaction_date: e.target.value })}
                    className="w-full bg-surface-accent/20 border border-outline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-on-surface-variant uppercase mb-2 block">項目說明</label>
                  <input
                    type="text"
                    value={addForm.description}
                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    placeholder="例如：午餐"
                    className="w-full bg-surface-accent/20 border border-outline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-on-surface-variant uppercase mb-2 block">金額</label>
                  <input
                    type="number"
                    value={addForm.amount}
                    min="0"
                    step="1"
                    placeholder="0"
                    onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                    className="w-full bg-surface-accent/20 border border-outline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-on-surface-variant uppercase mb-2 block">分類</label>
                  <select
                    value={addForm.category}
                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value as TransactionCategory })}
                    className="w-full appearance-none bg-surface-accent/20 border border-outline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-surface-card">{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-on-surface-variant uppercase mb-2 block">商家</label>
                  <input
                    type="text"
                    value={addForm.merchant}
                    onChange={(e) => setAddForm({ ...addForm, merchant: e.target.value })}
                    placeholder="選填"
                    className="w-full bg-surface-accent/20 border border-outline rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              {addError && (
                <p className="mt-4 text-xs font-bold text-error bg-error/10 rounded-xl px-4 py-3">{addError}</p>
              )}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-outline text-on-surface-variant font-bold text-sm hover:bg-white/5 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={saveAdd}
                  disabled={addSaving}
                  className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm hover:bg-primary/80 transition-colors disabled:opacity-50"
                >
                  {addSaving ? '新增中...' : '新增'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        <div className="p-10 max-w-screen-2xl mx-auto w-full mb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'overview' && (
                <OverviewView
                  totalExpense={stats.totalExpense}
                  monthlyBudget={stats.monthlyBudget}
                  remaining={stats.remaining}
                  categoryTotals={stats.categoryTotals}
                  weeklyExpenses={stats.weeklyExpenses}
                  loading={stats.loading}
                />
              )}
              {activeTab === 'analytics' && (
                <AnalyticsView
                  categoryTotals={stats.categoryTotals}
                  topMerchants={stats.topMerchants}
                  monthlyBudget={stats.monthlyBudget}
                  totalExpense={stats.totalExpense}
                  monthlyBalance={stats.monthlyBalance}
                  transactions={transactions}
                  loading={stats.loading}
                />
              )}
              {activeTab === 'transactions' && (
                <TransactionsView
                  transactions={transactions}
                  loading={txLoading}
                  error={txError}
                  onRefresh={() => { setTxRefreshKey((k) => k + 1); setStatsRefreshKey((k) => k + 1); }}
                />
              )}
              {activeTab === 'budget' && (
                <BudgetView
                  stats={stats}
                  onRefresh={() => setStatsRefreshKey((k) => k + 1)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
