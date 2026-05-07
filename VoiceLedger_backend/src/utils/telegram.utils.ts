import https from 'https';
import http from 'http';
import { env } from '../config/env.js';

export async function downloadTelegramFile(fileId: string): Promise<{ buffer: Buffer; filename: string }> {
  // 取得 file path
  const fileInfoUrl = `https://api.telegram.org/bot${env.telegramBotToken}/getFile?file_id=${fileId}`;
  const fileInfo = await fetchJson<{ ok: boolean; result: { file_path: string } }>(fileInfoUrl);

  if (!fileInfo.ok) throw new Error('無法取得 Telegram 檔案資訊');

  const filePath = fileInfo.result.file_path;
  const fileUrl = `https://api.telegram.org/file/bot${env.telegramBotToken}/${filePath}`;
  const filename = filePath.split('/').pop() ?? 'voice.ogg';

  const buffer = await downloadBuffer(fileUrl);
  return { buffer, filename };
}

function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(JSON.parse(data) as T));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function downloadBuffer(url: string, maxRedirects = 5): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) && res.headers.location) {
        if (maxRedirects <= 0) { reject(new Error('redirect 次數過多')); return; }
        resolve(downloadBuffer(res.headers.location, maxRedirects - 1));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}
