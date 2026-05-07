import type { Context } from 'telegraf';
import type { SessionData } from '../../types/index.js';
import { downloadTelegramFile } from '../../utils/telegram.utils.js';
import { transcribeAudio } from '../../services/stt.service.js';
import { parseTransactions } from '../../services/llm.service.js';
import { getOrCreateProfile } from '../../services/transaction.service.js';
import { formatConfirmMessage } from '../../utils/format.utils.js';
import { buildConfirmKeyboard } from '../keyboards/confirm.keyboard.js';

type BotContext = Context & { session: SessionData };

export async function handleVoice(ctx: BotContext): Promise<void> {
  const message = ctx.message as { voice?: { file_id: string }; audio?: { file_id: string } };
  const fileId = message.voice?.file_id ?? message.audio?.file_id;
  if (!fileId) return;

  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const processing = await ctx.reply('收到語音，解析中...');

  try {
    // 下載語音
    const { buffer, filename } = await downloadTelegramFile(fileId);

    // STT
    console.log(`音訊下載完成：${filename}，大小 ${buffer.length} bytes`);
    const transcription = await transcribeAudio(buffer, filename);
    if (!transcription) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id, processing.message_id, undefined,
        '無法辨識語音內容，請再試一次。'
      );
      return;
    }

    // LLM 解析
    const today = new Date().toISOString().slice(0, 10);
    const items = await parseTransactions(transcription, today);

    if (items.length === 0) {
      await ctx.telegram.editMessageText(
        ctx.chat!.id, processing.message_id, undefined,
        `轉譯內容：「${transcription}」\n\n無法從中解析出交易資訊，請再試一次。`
      );
      return;
    }

    // 查找或建立使用者 profile
    const profile = await getOrCreateProfile(
      telegramId,
      ctx.from?.username ?? ctx.from?.first_name ?? 'unknown'
    );

    // 暫存到 session
    const sessionId = `${telegramId}_${Date.now()}`;
    ctx.session.pending = {
      userId: profile.id,
      rawText: transcription,
      transcription,
      items,
    };

    // 回傳確認訊息
    const confirmText = formatConfirmMessage(items, transcription);
    await ctx.telegram.editMessageText(
      ctx.chat!.id, processing.message_id, undefined,
      confirmText,
      buildConfirmKeyboard(sessionId) as object
    );
  } catch (err) {
    console.error('語音處理失敗:', err);
    await ctx.telegram.editMessageText(
      ctx.chat!.id, processing.message_id, undefined,
      '處理時發生錯誤，請稍後再試。'
    );
  }
}
