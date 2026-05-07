import type { Context } from 'telegraf';
import type { SessionData } from '../../types/index.js';
import { insertTransactions } from '../../services/transaction.service.js';
import { formatSuccessMessage } from '../../utils/format.utils.js';

type BotContext = Context & { session: SessionData };

export function registerCallbackHandlers(
  bot: { action: (pattern: RegExp | string, handler: (ctx: BotContext) => Promise<void>) => void }
) {
  // 確認記帳
  bot.action(/^confirm_/, async (ctx) => {
    const pending = ctx.session.pending;
    if (!pending) {
      await ctx.answerCbQuery('找不到待確認的記帳，請重新傳送語音。');
      return;
    }

    try {
      await insertTransactions(pending.userId, pending.items, pending.rawText);
      ctx.session.pending = undefined;

      await ctx.editMessageText(formatSuccessMessage(pending.items));
      await ctx.answerCbQuery('記帳成功');
    } catch (err) {
      console.error('寫入失敗:', err);
      await ctx.answerCbQuery('記帳失敗，請稍後再試');
    }
  });

  // 修改
  bot.action(/^modify_/, async (ctx) => {
    if (!ctx.session.pending) {
      await ctx.answerCbQuery('找不到待確認的記帳，請重新傳送語音。');
      return;
    }
    ctx.session.awaitingCorrection = true;
    await ctx.editMessageText(
      `目前解析內容：\n「${ctx.session.pending.transcription}」\n\n請直接輸入修正說明，例如：\n・「金額改為 200」\n・「分類改為交通」\n・「商家是全家便利商店」`
    );
    await ctx.answerCbQuery('請輸入修正內容');
  });

  // 取消
  bot.action(/^cancel_/, async (ctx) => {
    ctx.session.pending = undefined;
    ctx.session.awaitingCorrection = undefined;
    await ctx.editMessageText('已取消，資料未儲存。');
    await ctx.answerCbQuery('已取消');
  });
}
