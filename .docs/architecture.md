# 系統架構

## 整體架構

```
[Telegram 使用者] ─── webhook/polling ──→ [Node.js Bot (port 3001)]
                                                   │
                                            Groq Whisper STT
                                                   │
                                         OpenRouter LLM API
                                         (gemini-2.5-flash-preview:free)
                                                   │
                                         Supabase (service key, bypass RLS)
                                                   │
                                  [PostgreSQL: transactions / profiles]
                                                   │
                                       anon key + Google OAuth JWT
                                                   │
                                       [Vite Dev / Vercel: React Dashboard]
```

## 目錄結構

```
VoiceLedger/
├── VoiceLedger_backend/
│   ├── src/
│   │   ├── index.ts                 # 入口：Express + Bot 啟動
│   │   ├── config/env.ts            # 環境變數驗證
│   │   ├── bot/
│   │   │   ├── bot.ts               # Telegraf singleton
│   │   │   ├── handlers/
│   │   │   │   ├── voice.handler.ts     # 語音主流程
│   │   │   │   ├── callback.handler.ts  # Inline Keyboard 回呼
│   │   │   │   ├── command.handler.ts   # /start /help /myid
│   │   │   │   └── text.handler.ts      # 修改模式文字輸入
│   │   │   └── keyboards/
│   │   │       └── confirm.keyboard.ts  # 確認/修改/取消
│   │   ├── services/
│   │   │   ├── stt.service.ts       # Groq Whisper
│   │   │   ├── llm.service.ts       # OpenRouter LLM
│   │   │   ├── supabase.service.ts  # Supabase service key client
│   │   │   └── transaction.service.ts # CRUD
│   │   ├── utils/
│   │   │   ├── telegram.utils.ts    # 語音檔下載
│   │   │   └── format.utils.ts      # 確認訊息組裝
│   │   └── types/index.ts
│   ├── .env                         # 不進 git
│   └── render.yaml                  # Render 部署設定
│
└── VoiceLedger_frontend/
    ├── src/
    │   ├── App.tsx                  # 主應用（含 Google Auth 判斷）
    │   ├── api/queries.ts           # Supabase 查詢函式
    │   ├── hooks/
    │   │   ├── useAuth.ts           # Google OAuth
    │   │   ├── useTransactions.ts   # 交易列表
    │   │   └── useMonthlyStats.ts   # 月統計（支援 refreshKey）
    │   ├── components/
    │   │   ├── LoginPage.tsx        # Google 登入頁
    │   │   └── BudgetView.tsx       # 預算管理 + Telegram 綁定
    │   ├── lib/supabase.ts          # Supabase anon key client
    │   └── types/index.ts
    └── .env.local                   # 不進 git
```

## 資料庫 Schema

```sql
profiles (
  id uuid PK → references auth.users,
  telegram_id bigint UNIQUE,
  username text,
  monthly_budget numeric DEFAULT 10000,
  created_at timestamptz
)

transactions (
  id uuid PK,
  user_id uuid → references profiles.id,
  description text,
  amount numeric,  -- 支出為負，收入為正
  category text CHECK IN ('餐飲','交通','生活','購物','娛樂','醫療保健','其他'),
  sub_category text,
  merchant text,
  raw_text text,
  transaction_date date,
  created_at timestamptz
)
```

## 環境變數

### 後端 (.env)
| 變數 | 用途 |
|------|------|
| TELEGRAM_BOT_TOKEN | Telegraf Bot |
| GROQ_API_KEY | Whisper STT |
| OPENROUTER_API_KEY | LLM 解析 |
| LLM_MODEL | 預設 `google/gemini-2.5-flash-preview:free` |
| SUPABASE_URL | Supabase 專案 URL |
| SUPABASE_SERVICE_KEY | 繞過 RLS，僅後端使用 |
| BOT_MODE | `polling`（本地）/ `webhook`（部署） |
| WEBHOOK_DOMAIN | 部署後的域名 |
| PORT | 預設 3001 |

### 前端 (.env.local)
| 變數 | 用途 |
|------|------|
| VITE_SUPABASE_URL | Supabase 專案 URL |
| VITE_SUPABASE_ANON_KEY | 前端只讀，受 RLS 保護 |

## 語音記帳流程

```
使用者傳語音
  ↓ downloadTelegramFile() → Buffer(.ogg)
  ↓ transcribeAudio() → Groq Whisper → 文字
  ↓ parseTransactions() → OpenRouter LLM → ParsedTransaction[]
  ↓ getOrCreateProfile() → 查找 telegram_id 對應的 profile
  ↓ Bot 回傳確認訊息 + [確認記帳 / 修改 / 取消]
  ↓
確認 → insertTransactions() → Supabase
修改 → 使用者輸入修正文字 → 重新 LLM 解析 → 再次確認
取消 → 清空 session
```

## 第一次使用流程

1. 使用者至 Dashboard 以 Google 帳戶登入（建立 auth.users + profiles 行）
2. 進入「預算管理」頁，填入 Telegram ID（傳 `/myid` 給 Bot 取得）
3. 之後即可透過 Telegram Bot 語音記帳
