import type { ParsedTransaction } from '../types/index.js';

export function formatConfirmMessage(items: ParsedTransaction[], transcription: string): string {
  const lines = items.map((item, i) => {
    const sign = item.amount < 0 ? '-' : '+';
    const abs = Math.abs(item.amount);
    const merchant = item.merchant ? ` @ ${item.merchant}` : '';
    return `${i + 1}. ${item.description}${merchant}\n   ${item.category}／${item.sub_category || '未分類'}  ${sign}$${abs}  (${item.transaction_date})`;
  });

  return (
    `解析完成，共 ${items.length} 筆：\n\n` +
    lines.join('\n\n') +
    `\n\n原文：「${transcription}」\n\n請確認是否記帳？`
  );
}

export function formatSuccessMessage(items: ParsedTransaction[]): string {
  const lines = items.map((item, i) => {
    const sign = item.amount < 0 ? '-' : '+';
    const abs = Math.abs(item.amount);
    const merchant = item.merchant ? ` @ ${item.merchant}` : '';
    const sub = item.sub_category ? `｜${item.sub_category}` : '';
    return `${i + 1}. ${item.description}${merchant}\n   ${item.category}${sub}  ${sign}$${abs}`;
  });

  return (
    `已記帳 ${items.length} 筆 ✓\n\n` +
    lines.join('\n\n') +
    `\n\n資料已同步至 Dashboard。`
  );
}
