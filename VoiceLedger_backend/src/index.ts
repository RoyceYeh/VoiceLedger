import 'dotenv/config';
import express from 'express';
import { env } from './config/env.js';
import bot from './bot/bot.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mode: env.botMode });
});

async function main() {
  if (env.botMode === 'webhook') {
    const webhookPath = `/webhook/${env.telegramBotToken}`;
    const webhookUrl = `${env.webhookDomain}${webhookPath}`;

    app.use(webhookPath, (req, res) => {
      bot.handleUpdate(req.body, res);
    });

    app.listen(env.port, () => {
      console.log(`HTTP 伺服器啟動，port ${env.port}`);
    });

    await bot.telegram.setWebhook(webhookUrl);
    console.log(`Webhook 設定完成：${webhookUrl}`);
  } else {
    // 本地開發：long polling
    app.listen(env.port, () => {
      console.log(`HTTP 伺服器啟動，port ${env.port}（health check 用）`);
    });

    await bot.launch();
    console.log('Bot 啟動（polling 模式）');
  }

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

main().catch((err) => {
  console.error('啟動失敗:', err);
  process.exit(1);
});
