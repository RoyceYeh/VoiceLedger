import type { Context } from 'telegraf';
import { getBudgetByTelegramId, updateBudgetByTelegramId, getMonthlySummaryByTelegramId } from '../../services/transaction.service.js';

export function registerCommandHandlers(bot: { command: (cmd: string, handler: (ctx: Context) => Promise<void>) => void }) {
  bot.command('start', async (ctx) => {
    const name = ctx.from?.first_name ?? '使用者';
    await ctx.reply(
      `你好，${name}！歡迎使用 VoiceLedger 語音記帳。\n\n` +
      `傳送語音訊息或直接打字，我會自動幫你解析並記帳。\n\n` +
      `請先至 Dashboard 完成 Google 登入，並在設定中填入你的 Telegram ID：${ctx.from?.id}`
    );
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      '使用說明：\n\n' +
      '語音記帳：\n' +
      '1. 傳送語音訊息描述支出\n' +
      '2. 確認 AI 解析結果\n' +
      '3. 點「確認記帳」完成\n\n' +
      '文字記帳：\n' +
      '直接輸入消費內容即可，例如：\n' +
      '「午餐麥當勞 150，搭捷運 30」\n\n' +
      '指令：\n' +
      '/summary - 查詢本月支出摘要\n' +
      '/budget - 查詢目前月預算\n' +
      '/budget 金額 - 設定月預算（例如 /budget 30000）\n' +
      '/myid - 查詢你的 Telegram ID\n' +
      '/help - 顯示使用說明'
    );
  });

  bot.command('myid', async (ctx) => {
    await ctx.reply(`你的 Telegram ID 是：${ctx.from?.id}`);
  });

  bot.command('summary', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const summary = await getMonthlySummaryByTelegramId(telegramId);
    if (!summary) {
      await ctx.reply('尚未綁定帳號，請先至 Dashboard 設定 Telegram ID。');
      return;
    }

    const pct = summary.monthlyBudget > 0
      ? ((summary.totalExpense / summary.monthlyBudget) * 100).toFixed(1)
      : '—';

    const categoryLines = summary.categoryTotals.length > 0
      ? summary.categoryTotals
          .map((c) => `${c.category.padEnd(6)}$${c.total.toLocaleString()}`)
          .join('\n')
      : '本月尚無支出記錄';

    await ctx.reply(
      `📊 ${summary.monthLabel} 支出摘要\n\n` +
      `已用 $${summary.totalExpense.toLocaleString()} / $${summary.monthlyBudget.toLocaleString()}（${pct}%）\n` +
      `剩餘 $${summary.remaining.toLocaleString()}\n\n` +
      `各類別：\n${categoryLines}`
    );
  });

  bot.command('budget', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const parts = text.trim().split(/\s+/);
    const arg = parts[1];

    if (!arg) {
      const budget = await getBudgetByTelegramId(telegramId);
      if (budget === null) {
        await ctx.reply('尚未綁定帳號，請先至 Dashboard 設定 Telegram ID。');
      } else {
        await ctx.reply(`目前月預算：$${budget.toLocaleString()}\n\n設定方式：/budget 金額\n例如：/budget 30000`);
      }
      return;
    }

    const value = parseInt(arg, 10);
    if (isNaN(value) || value <= 0) {
      await ctx.reply('金額格式錯誤，請輸入正整數。\n例如：/budget 30000');
      return;
    }

    await updateBudgetByTelegramId(telegramId, value);
    await ctx.reply(`月預算已更新為 $${value.toLocaleString()} ✓`);
  });
}
