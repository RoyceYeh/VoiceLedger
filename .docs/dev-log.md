# 開發日誌

## 2026-05-05

### 本次完成

**從零建立完整專案骨架（第一個 session）**

#### 後端（VoiceLedger_backend）— 全新建立
- `src/index.ts`：Express health check + Bot 啟動（polling/webhook 自動切換）
- `src/config/env.ts`：環境變數驗證，啟動時 fail-fast
- `src/services/stt.service.ts`：Groq Whisper STT（.ogg Buffer → 文字）
- `src/services/llm.service.ts`：OpenRouter API（文字 → ParsedTransaction[]）
- `src/services/supabase.service.ts`：Supabase service key client
- `src/services/transaction.service.ts`：Profile 查詢/建立、交易批次寫入
- `src/bot/handlers/voice.handler.ts`：完整語音處理主流程
- `src/bot/handlers/callback.handler.ts`：Inline Keyboard 確認/修改/取消
- `src/bot/handlers/command.handler.ts`：/start /help /myid 指令
- `src/bot/handlers/text.handler.ts`：修改模式的文字修正處理
- `src/bot/keyboards/confirm.keyboard.ts`：確認/修改/取消三鍵盤

#### 前端（VoiceLedger_frontend）— 新增並更新
- `src/lib/supabase.ts`：Supabase anon key client
- `src/api/queries.ts`：月交易/分類統計/商家排行/Profile CRUD
- `src/hooks/useAuth.ts`：Google OAuth 登入狀態管理
- `src/hooks/useTransactions.ts`：交易列表 hook（帶月份篩選）
- `src/hooks/useMonthlyStats.ts`：月統計數據 hook（支援 refreshKey）
- `src/components/LoginPage.tsx`：Google 登入頁面
- `src/components/BudgetView.tsx`：預算管理頁（月預算設定 + Telegram 綁定）
- `src/App.tsx`：改用真實 Supabase 資料，加入 Google Auth 流程
- `src/types/index.ts`：前端共用型別

#### 基礎建設
- Supabase profiles + transactions 表建立（含 RLS + DB Trigger）
- Google OAuth 設定（Supabase Auth + Google Cloud Console）
- 所有環境變數設定完成（前後端 .env）

---

### 踩過的坑

| 問題 | 原因 | 解法 |
|------|------|------|
| 前後端 port 衝突 | 兩個都預設 3000 | 後端改為 3001 |
| Groq 拒絕語音檔 | Node.js 用 `new File()` 格式不對 | 改用 groq-sdk 的 `toFile()` helper |
| Gemini 1.5 Flash 404 | `@google/genai` v1.x 用 v1beta，模型名稱路徑不符 | 改用 OpenRouter + `gemini-2.5-flash-preview:free` |
| Gemini 2.0 Flash 429 | API key 對應 GCP 專案的免費額度為 0 | 改用 OpenRouter 徹底解決 |
| LLM 回傳空結果 | `response_format: json_object` 要求物件但 prompt 要求陣列 | Prompt 改為回傳 `{"transactions":[...]}` |
| Supabase RLS update 靜默失敗 | UPDATE policy 缺少 `with check` | 補上 `with check (auth.uid() = id)` |
| `useMonthlyStats` 更新後不重取 | `refreshKey` 未傳入 hook | 加入 `refreshKey` 參數並作為 useEffect 依賴 |
| vite.config.ts 手動 define VITE_ 變數 | Vite 已自動處理 VITE_ 前綴，重複 define 造成衝突 | 移除多餘的 define 條目 |

---

### 技術決策

- **LLM 改用 OpenRouter**：Gemini API key 的免費額度問題，OpenRouter 提供統一入口且支援多種免費模型，換模型只需改 `.env` 的 `LLM_MODEL`
- **前端直讀 Supabase（anon key + RLS）**：個人系統不需額外 API 服務層，最簡單路徑
- **Bot session 用記憶體**：個人使用確認操作在 30 秒內完成，無需 Redis；Bot 重啟只影響未確認的語音
- **修改流程用對話式 LLM 重新解析**：比逐欄位編輯 UI 更自然，實作也更簡單

---

## 2026-05-05（第二個 session）

### 本次完成

#### 資產累積圖（分析頁底部）
- `src/types/index.ts`：新增 `MonthlyBalance` 介面（month、label、expense、remaining）
- `src/api/queries.ts`：新增 `getMonthlyBalance(monthlyBudget, months=6)` — 一次查詢近 N 個月支出，按月分組計算預算餘額
- `src/hooks/useMonthlyStats.ts`：加入 `monthlyBalance` 欄位；先取 profile 得到 budget，再鏈式呼叫 `getMonthlyBalance`
- `src/App.tsx`：AnalyticsView 底部新增翠綠色 AreaChart，y=0 有虛線參考線（超支視覺化）

#### 交易明細：日期區間篩選
- 新增 `startDate` / `endDate` state
- 篩選列加入兩個 `type="date"` input（位於搜尋欄與分類下拉之間）
- 開始日期 `max` 動態為結束日期或今天；結束日期 `min` 為開始日期、`max` 為今天
- `[color-scheme:dark]` 讓瀏覽器原生日曆彈窗顯示深色

#### 重整保留當前頁面
- `activeTab` state 改用 lazy initializer 從 `localStorage` 讀取
- 抽出 `switchTab` 函式，切換時同步寫入 `localStorage`

---

### 踩過的坑

| 問題 | 原因 | 解法 |
|------|------|------|
| 無支出資料時資產累積圖空白 | 全部 remaining 相同 → Recharts Y 軸 domain 為 [10000, 10000]，零高度 | `YAxis` 加 `domain={[0, dataMax * 1.2]}` |
| XAxis 第一個月 label 被裁切 | Recharts 第一刻度貼左邊界，文字向左溢出 | `XAxis` 加 `padding={{ left: 24, right: 24 }}` |

---

### 技術決策

- **資產累積圖用「預算 - 支出」而非「收入 - 支出」**：目前交易資料無收入來源，預算餘額更能反映每月節餘狀況，未來有收入資料後可再調整
- **activeTab 存 localStorage 不存 URL hash**：SPA 不涉及路由，localStorage 最簡單，不影響分享連結語意

---

## 2026-05-06

### 本次完成

#### Bot 新指令
- **`/budget`**：無參數 → 顯示目前月預算；帶數字 → 直接更新（`updateBudgetByTelegramId`）
- **`/summary`**：查詢本月支出摘要，顯示總支出 / 預算 / 百分比 / 各類別金額排序（`getMonthlySummaryByTelegramId`）
- `/help` 一併更新加入兩個新指令說明
- 新增 `transaction.service.ts` 的三個 function：`updateBudgetByTelegramId`、`getBudgetByTelegramId`、`getMonthlySummaryByTelegramId`

#### 分析頁改版
- **類別分析返回按鈕**：鑽取子分類後標題左側出現 `←` 圖示，點擊重設 `selectedCategory = null`；標題同步顯示目前類別名稱
- **類別分析固定列 7 個**：原本只顯示有資料的類別，改為固定列出全部 7 個；無資料者顯示 `$0` 且透明度降低、不可點擊
- **預算燃燒圖高度對齊**：移除 `h-[400px]` 固定高度，改為 CSS grid stretch 自動對齊右側類別分析高度；圖表容器改為 `h-64`

#### 前端新增消費功能
- 側邊欄「語音輸入」→「新增消費」，icon 從 `Mic` 改為 `Plus`
- 點擊開啟 Modal（與編輯交易版面相同）：日期、說明、金額、分類、商家
- `queries.ts` 新增 `insertTransaction(userId, fields)`，金額存為負數（支出）
- 儲存後同步觸發 `txRefreshKey` + `statsRefreshKey`
- 需要在 Supabase 加 INSERT RLS policy（見踩坑記錄）

---

### 踩過的坑

| 問題 | 原因 | 解法 |
|------|------|------|
| `Mic is not defined` runtime error | 移除 import 後 Vite HMR 沒完全更新 | 重啟 dev server 或硬重整瀏覽器（Ctrl+Shift+R） |
| 前端新增交易 POST 403 | transactions 表缺少前端的 INSERT RLS policy | 在 Supabase SQL Editor 執行：`CREATE POLICY "Users can insert their own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);` |

---

### 技術決策

- **`/summary` 直接查 Supabase 不經 Bot session**：純查詢無副作用，不需要 pending 狀態，直接用 telegram_id 關聯 profile
- **新增消費 Modal 重用 EditForm 介面**：兩者欄位完全相同，沒有額外抽象的必要
- **`insertTransaction` 接受 `string | null`**：Supabase INSERT 允許 null，型別與後端 `insertTransactions` 行為一致
