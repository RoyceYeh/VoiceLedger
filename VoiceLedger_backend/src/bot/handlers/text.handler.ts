import type { Context } from 'telegraf';
import type { SessionData } from '../../types/index.js';
import { parseTransactions } from '../../services/llm.service.js';
import { getOrCreateProfile } from '../../services/transaction.service.js';
import { formatConfirmMessage } from '../../utils/format.utils.js';
import { buildConfirmKeyboard } from '../keyboards/confirm.keyboard.js';

type BotContext = Context & { session: SessionData };

export async function handleText(ctx: BotContext): Promise<void> {
  const message = ctx.message as { text?: string };
  const text = message.text?.trim();
  if (!text || text.startsWith('/')) return;

  // 修改模式（有待確認記帳且正在等待修正文字）
  if (ctx.session.awaitingCorrection && ctx.session.pending) {
    const { transcription, userId } = ctx.session.pending;
    ctx.session.awaitingCorrection = undefined;

    const processing = await ctx.reply('重新解析中...');

    try {
      const today = new Date().toISOString().slice(0, 10);
      const correctedPrompt = `${transcription}（修正：${text}）`;
      const items = await parseTransactions(correctedPrompt, today);

      if (items.length === 0) {
        await ctx.telegram.editMessageText(
          ctx.chat!.id, processing.message_id, undefined,
          '修正後仍無法解析，請重新傳送語音或文字。'
        );
        ctx.session.pending = undefined;
        return;
      }

      ctx.session.pending = { userId, rawText: correctedPrompt, transcription: correctedPrompt, items };

      const sessionId = `${ctx.from!.id}_${Date.now()}`;
      const confirmText = formatConfirmMessage(items, correctedPrompt);
      await ctx.telegram.editMessageText(
        ctx.chat!.id, processing.message_id, undefined,
        confirmText,
        buildConfirmKeyboard(sessionId) as object
      );
    } catch (err) {
      console.error('修正解析失敗:', err);
      await ctx.telegram.editMessageText(
        ctx.chat!.id, processing.message_id, undefined,
        '重新解析時發生錯誤，請再試一次。'
      );
    }
    return;
  }

  // 有待確認記帳但未進入修改模式，等待 Inline Keyboard 操作
  if (ctx.session.pending) return;

  // 直接打字記帳（新記帳流程）
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const processing = await ctx.reply('解析中...');

  try {
    const today = new Date().toISOString().slice(0, 10);
    const items = await parseTransactions(text, today);

    if (items.length === 0) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id, processing.message_id, undefined,
        `無法從「${text}」解析出交易資訊，請試著描述消費項目和金額。\n\n範例：「午餐麥當勞 150，搭捷運 30」`
      );
      return;
    }

    const profile = await getOrCreateProfile(
      telegramId,
      ctx.from?.username ?? ctx.from?.first_name ?? 'unknown'
    );

    ctx.session.pending = {
      userId: profile.id,
      rawText: text,
      transcription: text,
      items,
    };

    const sessionId = `${telegramId}_${Date.now()}`;
    const confirmText = formatConfirmMessage(items, text);
    await ctx.telegram.editMessageText(
      ctx.chat!.id, processing.message_id, undefined,
      confirmText,
      buildConfirmKeyboard(sessionId) as object
    );
  } catch (err) {
    console.error('文字記帳解析失敗:', err);
    await ctx.telegram.editMessageText(
      ctx.chat!.id, processing.message_id, undefined,
      '解析時發生錯誤，請稍後再試。'
    );
  }
}
