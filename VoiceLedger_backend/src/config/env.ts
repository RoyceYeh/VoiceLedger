import 'dotenv/config';

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`缺少必要環境變數：${key}`);
  return value;
}

export const env = {
  telegramBotToken: required('TELEGRAM_BOT_TOKEN'),
  groqApiKey: required('GROQ_API_KEY'),
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  openrouterApiKey: required('OPENROUTER_API_KEY'),
  llmModel: process.env.LLM_MODEL ?? 'google/gemini-2.5-flash-preview:free',
  supabaseUrl: required('SUPABASE_URL'),
  supabaseServiceKey: required('SUPABASE_SERVICE_KEY'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  botMode: (process.env.BOT_MODE ?? 'polling') as 'polling' | 'webhook',
  webhookDomain: process.env.WEBHOOK_DOMAIN ?? '',
};
