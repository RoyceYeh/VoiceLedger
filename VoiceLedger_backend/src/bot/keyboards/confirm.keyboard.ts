import { Markup } from 'telegraf';
import type { TransactionCategory, ParsedTransaction } from '../../types/index.js';
import { VALID_SUB_CATEGORIES } from '../../services/llm.service.js';

const ALL_CATEGORIES: TransactionCategory[] = [
  '餐飲', '交通', '生活', '購物', '娛樂', '醫療保健', '其他',
];

export function buildConfirmKeyboard(sessionId: string) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback('確認記帳', `confirm_${sessionId}`),
      Markup.button.callback('取消', `cancel_${sessionId}`),
    ],
    [
      Markup.button.callback('修改分類', 'modify_cat'),
      Markup.button.callback('修改', `modify_${sessionId}`),
    ],
  ]);
}

export function buildItemSelectKeyboard(items: ParsedTransaction[]) {
  return Markup.inlineKeyboard([
    ...items.map((item, i) => [
      Markup.button.callback(`第 ${i + 1} 筆：${item.description}`, `edit_item_${i}`),
    ]),
    [Markup.button.callback('← 返回', 'back_to_confirm')],
  ]);
}

export function buildCategoryKeyboard(itemIndex: number) {
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < ALL_CATEGORIES.length; i += 3) {
    rows.push(
      ALL_CATEGORIES.slice(i, i + 3).map((c) =>
        Markup.button.callback(c, `set_cat_${itemIndex}_${c}`)
      )
    );
  }
  rows.push([Markup.button.callback('← 返回', 'back_to_confirm')]);
  return Markup.inlineKeyboard(rows);
}

export function buildSubCategoryKeyboard(itemIndex: number, category: TransactionCategory) {
  const subs = VALID_SUB_CATEGORIES[category];
  const rows: ReturnType<typeof Markup.button.callback>[][] = [];
  for (let i = 0; i < subs.length; i += 3) {
    rows.push(
      subs.slice(i, i + 3).map((s) =>
        Markup.button.callback(s, `set_sub_${itemIndex}_${s}`)
      )
    );
  }
  rows.push([Markup.button.callback('跳過', `skip_sub_${itemIndex}`)]);
  return Markup.inlineKeyboard(rows);
}
