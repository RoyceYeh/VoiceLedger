# Todos

## 已完成

- [x] Supabase 資料庫建立（profiles + transactions + RLS + Trigger）
- [x] Google OAuth 設定（Supabase Auth + Google Cloud Console）
- [x] 後端 Node.js 專案骨架建立
- [x] Groq Whisper STT 整合
- [x] OpenRouter LLM 解析整合（含多筆拆分）
- [x] Telegram Bot 語音記帳完整流程
- [x] Bot 確認/取消 Inline Keyboard
- [x] Bot 修改功能（文字修正 → LLM 重新解析）
- [x] 前端 Google OAuth 登入保護
- [x] 前端 Supabase 資料連接（替換 Mock 資料）
- [x] 前端 useMonthlyStats / useTransactions hooks
- [x] 預算管理頁面（月預算設定 + Telegram ID 綁定）
- [x] Dashboard 儲存後 refreshKey 觸發重新取資料
- [x] 商家排行「血汗錢去哪了」移至總覽頁底部
- [x] LLM Prompt 優化：交通工具/動詞不填入 merchant
- [x] 資產累積圖（分析頁底部，近6個月預算餘額 AreaChart）
- [x] 交易明細：日期區間篩選（不可選未來日期）
- [x] 重整保留當前頁面（localStorage 記憶 activeTab）

## 待完成

- [x] 交易明細：編輯功能（點鉛筆圖示可修改欄位）
- [x] 交易明細：刪除功能（點垃圾桶圖示確認刪除）
- [x] Dashboard 記帳後即時更新（Supabase Realtime 訂閱）
- [x] 分析頁：二級分類鑽取（選擇類別後顯示子分類進度條明細）
- [x] Bot：/summary 指令（查詢本月支出摘要）
- [x] Bot：/budget 指令（查詢 / 設定月預算）
- [x] 分析頁：類別分析返回按鈕
- [x] 分析頁：類別分析固定列出 7 個類別
- [x] 前端新增消費 Modal（側邊欄按鈕）
- [ ] 報表頁：尚未實作（目前側邊欄沒有此選項）
- [ ] 部署：後端部署到 Render，設定 Telegram Webhook
- [ ] 部署：前端部署到 Vercel（或靜態 FTP hosting）
- [ ] AI 財務教練：接真實 LLM 生成個人化建議（目前是靜態文字）
- [ ] Supabase INSERT policy：需手動在 SQL Editor 加（新增消費功能的前提）
