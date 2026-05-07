import { Telegraf, session } from 'telegraf';
import type { SessionData } from '../types/index.js';
import { env } from '../config/env.js';
import { registerCommandHandlers } from './handlers/command.handler.js';
import { handleVoice } from './handlers/voice.handler.js';
import { registerCallbackHandlers } from './handlers/callback.handler.js';
import { handleText } from './handlers/text.handler.js';

type BotContext = Parameters<typeof handleVoice>[0];

const bot = new Telegraf<BotContext>(env.telegramBotToken);

// session middleware（記憶體暫存，Bot 重啟會清空）
bot.use(session({ defaultSession: (): SessionData => ({}) }));

// 全域錯誤捕捉，避免 Bot 崩潰
bot.catch((err, ctx) => {
  console.error(`Bot 錯誤 [${ctx.updateType}]:`, err);
});

// 註冊指令
registerCommandHandlers(bot as Parameters<typeof registerCommandHandlers>[0]);

// 語音訊息
bot.on('voice', handleVoice);
bot.on('audio', handleVoice);

// Inline Keyboard 回呼
registerCallbackHandlers(bot as Parameters<typeof registerCallbackHandlers>[0]);

// 文字訊息（新記帳 / 修改模式）
bot.on('text', handleText);

export default bot;
