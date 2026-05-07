import Groq, { toFile } from 'groq-sdk';
import { env } from '../config/env.js';

const groq = new Groq({ apiKey: env.groqApiKey });

export async function transcribeAudio(buffer: Buffer, filename: string): Promise<string> {
  // 確保副檔名為 .ogg，Groq 才能識別格式
  const safeFilename = filename.endsWith('.ogg') ? filename : filename.replace(/\.[^.]+$/, '') + '.ogg';

  const file = await toFile(buffer, safeFilename, { type: 'audio/ogg' });

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    language: 'zh',
    response_format: 'text',
  });

  const text = transcription as unknown as string;
  return typeof text === 'string' ? text.trim() : '';
}
