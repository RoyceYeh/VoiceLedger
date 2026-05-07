# 📝 專案需求與技術規格書：AI 語音自動記帳系統 (Voice-Ledger AI)

## 一、 專案概述

本專案旨在開發一款基於 LLM（大型語言模型）的語音記帳系統。透過 Telegram 語音輸入，系統能自動進行語意解析、模糊分類與多筆帳目拆分，最終於網頁端呈現現代化且視覺化的個人財務儀表板。

- **核心痛點解決：** 消除手動輸入與分類的阻力、支援白話文「模糊對話」、自動拆分「單次語音中的多筆消費」。
- **最高原則：** 
    1. 採用歐美主流或開源技術，**嚴格避開中國相關 AI 與技術框架**。
    2. 最大化利用**免費層級 (Free Tier)**，達成零固定成本營運。

---

## 二、 核心功能需求

### 1. 語音輸入與解析 (Telegram Bot)
- **語音接收**：透過 Telegram Bot 錄製並傳送語音訊息（.ogg 格式）。
- **智慧解析**： 
    - STT: 呼叫 Groq (Whisper-large-v3) 將語音轉為文字。
    - LLM: 使用 Gemini 1.5 Flash 進行語意分析，提取「項目」、「金額」、「類別」、「商家」、「日期」。
- **自動拆分**：支援單筆語音包含多項支出（例：「早餐 50 加上午餐 120」自動拆為兩筆）。
- **確認機制**：解析後回傳 Inline Keyboard 按鈕（確認、修改、取消），使用者點擊「確認」後才寫入資料庫。

### 2. 視覺化儀表板 (Web Dashboard)
- **AI 財務教練**：頁面頂部由 Gemini 根據近期消費數據生成個人化財務建議。
- **總覽看板**：本月支出、預算燃燒、剩餘預算。
- **趨勢分析**： 
    - **支出趨勢**：每日消費波動圖。
    - **預算燃燒圖**：實際支出 vs. 理想預算線。
    - **淨資產累積**：每月儲蓄/結餘的成長曲線。
- **消費結構**： 
    - **類別佔比**：圓餅圖呈現 7 大主類別。
    - **二級鑽取**：點擊大類別可查看 AI 自由提取的「子分類」與「商家」。
    - **商家排行**：「血汗錢去哪了」排行，列出消費金額最高的商家。
- **交易明細**：可搜尋、篩選與手動修正帳目。

---

## 三、 記帳分類規範 (Strict Category Schema)

為確保統計準確性與圖表整潔，LLM 輸出的 `category` 欄位必須嚴格限制於以下 **7 大主分類**：

| 主分類 (Main Category) | 涵蓋範圍說明 | 常見子分類/項目參考 |
| :--- | :--- | :--- |
| **1. 餐飲** (Food & Dining) | 日常三餐、手搖飲與所有飲食消費 | 早餐、午餐、晚餐、飲料/咖啡、宵夜、零食 |
| **2. 交通** (Transportation) | 通勤、載具、燃料與乘車服務 | 捷運/公車、計程車/Uber、加油、停車費、維修 |
| **3. 生活** (Housing & Living) | 居住成本、固定耗品與社交往來 | 房租/房貸、水電瓦斯、網路、社交活動、送禮 |
| **4. 購物** (Shopping) | 非飲食類的實體/虛擬商品購買 | 服飾鞋包、3C/家電、保養/彩妝、書籍/文具 |
| **5. 娛樂** (Entertainment) | 休閒活動、數位訂閱與旅遊 | 電影、Netflix/Spotify、遊戲課金、旅遊/住宿 |
| **6. 醫療保健** (Health & Fitness)| 醫療、藥物、保健與運動維持 | 看診/掛號、藥品、健身/運動 |
| **7. 其他** (Others) | 無法歸類於上述的零星或意外支出 | 手續費、意外遺失、捐款、未分類 |

---

## 四、 UI/UX 設計規範 (根據 DESIGN.md)

### 1. 視覺風格：Modern Glassmorphic
- **深色底色**：採用 Foundation Black (#0b1326) 作為基底。
- **玻璃層次**：卡片使用半透明背景 (#171f33, 80% 標稱) 與 1px 白色邊框 (8-12% opacity)，搭配 `backdrop-filter: blur(12px)`。
- **光暈效果**：按鈕與重點元素使用微弱的彩色光暈 (Ambient Glows)，而非深色陰影。

### 2. 標準配色
- **主要動作 (Primary)**：Cyan (#4cd7f6 / #06b6d4)。
- **正面增長 (Secondary)**：Emerald Green (#10b981)。
- **支出/警示 (Error)**：Rose Red (#f43f5e)。
- **輔助色 (Tertiary)**：Pink (#ffb2b7)。

### 3. 字體要求
- **主字體**：Inter。
- **數字優化**：啟用 `font-feature-settings: 'tnum' on, 'lnum' on` 確保數字在表格中等寬對齊，便於財務掃瞄。

---

## 五、 技術選型 (Tech Stack)

### ☁️ 基礎建設 & AI
| 模組 | 採用技術/服務 | 說明 |
| :--- | :--- | :--- |
| **STT** | **Groq API (Whisper)** | 極速辨識，支援繁體中文。 |
| **LLM** | **Google Gemini 1.5 Flash** | 支援 JSON 模式，推理效率高且免費額度充足。 |
| **資料庫 (DB)** | **Supabase (PostgreSQL)** | 提供 SQL 存取、Row Level Security (RLS)。 |

### 🧠 後端 (Backend) - Node.js
| 模組 | 採用技術/服務 | 說明 |
| :--- | :--- | :--- |
| **核心環境** | **Node.js (TypeScript)** | 統一開發語言。 |
| **機器人框架** | **Telegraf** | 成熟的 Telegram Bot SDK。 |
| **部署平台** | **Render / Fly.io** | 支援 Docker 或 Node.js 直接部署。 |

### 🖥️ 前端 (Frontend) - React
| 模組 | 採用技術/服務 | 說明 |
| :--- | :--- | :--- |
| **核心框架** | **React 18 + Vite** | 極速建置。 |
| **圖表庫** | **Recharts** | 高可定製化的 React 圖表元件。 |
| **樣式** | **Tailwind CSS** | 實作深色模式與玻璃擬態。 |
| **動畫** | **Framer Motion** | 流暢的 UI 過場動畫。 |

---

## 六、 資料庫設計 (Supabase/PostgreSQL)

### 1. `profiles` (使用者資料)
- `id`: uuid (PK, references auth.users)
- `telegram_id`: bigint (Unique)
- `username`: text
- `monthly_budget`: numeric (預設預算)
- `created_at`: timestamp

### 2. `transactions` (交易明細)
- `id`: uuid (PK)
- `user_id`: uuid (References profiles.id)
- `description`: text (項目說明)
- `amount`: numeric (支出為負，收入為正)
- `category`: text (主分類，嚴格遵循 7 大類)
- `sub_category`: text (次分類)
- `merchant`: text (商家名稱)
- `raw_text`: text (原始語音轉文字內容)
- `transaction_date`: date (交易日期)
- `created_at`: timestamp

---

## 七、 LLM 解析策略 (Gemini Prompt)

系統應向 Gemini 發送以下結構的 Prompt 以獲取穩定 JSON：

```text
你是一個專業的財務秘書。請解析使用者的語音文字，並輸出 JSON 格式。
[嚴格限制] category 必須是：['餐飲', '交通', '生活', '購物', '娛樂', '醫療保健', '其他']。

輸入：「今天在 7-11 買了 50 元咖啡，晚餐吃火鍋花了 500 元」
輸出：
[
  { "description": "咖啡", "amount": 50, "category": "餐飲", "sub_category": "飲料", "merchant": "7-11", "date": "2024-05-05" },
  { "description": "火鍋", "amount": 500, "category": "餐飲", "sub_category": "正餐", "merchant": "火鍋店", "date": "2024-05-05" }
]
```

---

## 八、 專案目錄結構 (Polyrepo)

```text
VoiceLedger/
├── VoiceLedger_frontend/        (React Dashboard)
│   ├── src/
│   │   ├── components/          (UI 元件)
│   │   ├── hooks/               (Supabase 封裝)
│   │   ├── lib/                 (工具函式)
│   │   └── types/               (TypeScript 定義)
├── VoiceLedger_backend/         (Node.js Bot)
    ├── src/
    │   ├── bot/                 (Telegraf 邏輯)
    │   ├── services/            (AI & DB 服務)
    │   └── config/              (環境變數)
```

---

## 九、 實作時程 (Milestones)

1.  **Phase 1: 基礎建設** - Supabase 專案建立與 Table Schema 設定。
2.  **Phase 3: Bot 開發** - 串接 Groq STT 與 Gemini 解析，完成語音記帳流程。
3.  **Phase 4: Web 串接** - 將前端 Mock Data 替換為實際 Supabase API 數據。
4.  **Phase 5: 優化** - 完善二級類別鑽取與預算設定功能。
