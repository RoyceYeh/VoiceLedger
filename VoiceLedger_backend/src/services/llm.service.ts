import { env } from '../config/env.js';
import type { ParsedTransaction, TransactionCategory } from '../types/index.js';

const VALID_CATEGORIES: TransactionCategory[] = [
  '餐飲', '交通', '生活', '購物', '娛樂', '醫療保健', '其他',
];

const SYSTEM_PROMPT = `你是一個財務記帳助手。從使用者的語音轉文字中萃取消費資訊，回傳 JSON 物件。

規則：
1. 支出金額為負數，收入金額為正數
2. category 只能是：餐飲、交通、生活、購物、娛樂、醫療保健、其他
3. 一句話可能包含多筆，需拆分成多個物件放入 transactions 陣列
4. transaction_date 預設今天。支援以下日期表達，根據「今天日期」推算：
   - 相對：昨天、前天、大前天、X天前、上週X（如上週三）、這週X
   - 明確：X月X日、X月X號、X號（當月）
   - 預設今天，無法判斷時也填今天
5. merchant 填寫明確的店家或品牌名稱，例如「麥當勞」「全聯」「星巴克」。
   - 交通工具本身（捷運、公車、Uber、計程車、加油）不是商家，merchant 留空字串
   - 動詞或動作（搭、買、吃、喝）不是商家，不要填入 merchant
   - 語音辨識可能有誤字，請用語意判斷而非照字面複製
6. 完全無法解析則 transactions 為空陣列

只回傳以下格式的 JSON，不要任何說明文字：
{"transactions":[{"description":"星巴克拿鐵","amount":-120,"category":"餐飲","sub_category":"飲料","merchant":"星巴克","transaction_date":"2024-10-24"}]}`;

export async function parseTransactions(
  transcription: string,
  today: string,
): Promise<ParsedTransaction[]> {
  const userPrompt = `轉譯文字：「${transcription}」\n今天日期：${today}`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.openrouterApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.llmModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenRouter 錯誤 ${res.status}: ${body}`);
  }

  const data = await res.json() as { choices: { message: { content: string } }[] };
  const raw = data.choices[0]?.message?.content ?? '[]';

  // 部分模型回傳 {"transactions": [...]}，統一處理
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const arr: unknown[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as Record<string, unknown>).transactions)
      ? (parsed as Record<string, unknown>).transactions as unknown[]
      : [];

  return arr
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .filter((item) => VALID_CATEGORIES.includes(item.category as TransactionCategory))
    .map((item) => ({
      description: String(item.description ?? ''),
      amount: Number(item.amount ?? 0),
      category: item.category as TransactionCategory,
      sub_category: String(item.sub_category ?? ''),
      merchant: String(item.merchant ?? ''),
      transaction_date: String(item.transaction_date ?? today),
    }));
}
