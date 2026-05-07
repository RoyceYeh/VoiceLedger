import { Markup } from 'telegraf';

export function buildConfirmKeyboard(sessionId: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('確認記帳', `confirm_${sessionId}`),
      Markup.button.callback('修改', `modify_${sessionId}`),
      Markup.button.callback('取消', `cancel_${sessionId}`),
    ],
  ]);
}
