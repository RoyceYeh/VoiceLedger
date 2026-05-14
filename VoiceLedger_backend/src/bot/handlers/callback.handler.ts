import type { Context } from 'telegraf';
import type { SessionData, TransactionCategory } from '../../types/index.js';
import { insertTransactions } from '../../services/transaction.service.js';
import { VALID_SUB_CATEGORIES } from '../../services/llm.service.js';
import { formatSuccessMessage, formatConfirmMessage } from '../../utils/format.utils.js';
import {
  buildConfirmKeyboard,
  buildItemSelectKeyboard,
  buildCategoryKeyboard,
  buildSubCategoryKeyboard,
} from '../keyboards/confirm.keyboard.js';

type BotContext = Context & { session: SessionData; match?: RegExpExecArray };

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

  // 修改分類 → 單筆直接選主類，多筆先選哪一筆
  bot.action('modify_cat', async (ctx) => {
    const pending = ctx.session.pending;
    if (!pending) {
      await ctx.answerCbQuery('找不到待確認的記帳，請重新傳送語音。');
      return;
    }

    if (pending.items.length === 1) {
      await ctx.editMessageText('選擇主類別：', buildCategoryKeyboard(0) as object);
    } else {
      await ctx.editMessageText('選擇要修改哪一筆：', buildItemSelectKeyboard(pending.items) as object);
    }
    await ctx.answerCbQuery();
  });

  // 多筆：選第幾筆後跳主類選擇
  bot.action(/^edit_item_(\d+)$/, async (ctx) => {
    const pending = ctx.session.pending;
    if (!pending) { await ctx.answerCbQuery(); return; }
    const i = parseInt(ctx.match![1]);
    await ctx.editMessageText(`選擇主類別（第 ${i + 1} 筆）：`, buildCategoryKeyboard(i) as object);
    await ctx.answerCbQuery();
  });

  // 設定主類別 → 有子類則跳子類，無子類（其他）直接回確認
  bot.action(/^set_cat_(\d+)_(.+)$/, async (ctx) => {
    const pending = ctx.session.pending;
    if (!pending) { await ctx.answerCbQuery(); return; }
    const i = parseInt(ctx.match![1]);
    const category = ctx.match![2] as TransactionCategory;

    pending.items[i].category = category;
    pending.items[i].sub_category = '';

    const allowed = VALID_SUB_CATEGORIES[category];
    if (allowed.length === 0) {
      const sessionId = `${ctx.from!.id}_${Date.now()}`;
      await ctx.editMessageText(
        formatConfirmMessage(pending.items, pending.transcription),
        buildConfirmKeyboard(sessionId) as object
      );
    } else {
      await ctx.editMessageText('選擇子類別：', buildSubCategoryKeyboard(i, category) as object);
    }
    await ctx.answerCbQuery();
  });

  // 設定子類別 → 回確認畫面
  bot.action(/^set_sub_(\d+)_(.+)$/, async (ctx) => {
    const pending = ctx.session.pending;
    if (!pending) { await ctx.answerCbQuery(); return; }
    pending.items[parseInt(ctx.match![1])].sub_category = ctx.match![2];

    const sessionId = `${ctx.from!.id}_${Date.now()}`;
    await ctx.editMessageText(
      formatConfirmMessage(pending.items, pending.transcription),
      buildConfirmKeyboard(sessionId) as object
    );
    await ctx.answerCbQuery();
  });

  // 跳過子類別 → 回確認畫面
  bot.action(/^skip_sub_(\d+)$/, async (ctx) => {
    const pending = ctx.session.pending;
    if (!pending) { await ctx.answerCbQuery(); return; }
    const sessionId = `${ctx.from!.id}_${Date.now()}`;
    await ctx.editMessageText(
      formatConfirmMessage(pending.items, pending.transcription),
      buildConfirmKeyboard(sessionId) as object
    );
    await ctx.answerCbQuery();
  });

  // 返回確認畫面
  bot.action('back_to_confirm', async (ctx) => {
    const pending = ctx.session.pending;
    if (!pending) { await ctx.answerCbQuery(); return; }
    const sessionId = `${ctx.from!.id}_${Date.now()}`;
    await ctx.editMessageText(
      formatConfirmMessage(pending.items, pending.transcription),
      buildConfirmKeyboard(sessionId) as object
    );
    await ctx.answerCbQuery();
  });

  // 修改（文字輸入）
  bot.action(/^modify_/, async (ctx) => {
    if (!ctx.session.pending) {
      await ctx.answerCbQuery('找不到待確認的記帳，請重新傳送語音。');
      return;
    }
    ctx.session.awaitingCorrection = true;
    await ctx.editMessageText(
      `目前解析內容：\n「${ctx.session.pending.transcription}」\n\n請直接輸入修正說明，例如：\n・「金額改為 200」\n・「商家是全家便利商店」\n・「日期是昨天」`
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
