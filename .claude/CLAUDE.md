# CLAUDE.md

## 專案文件索引

| 文件 | 內容 |
|------|------|
| [.docs/architecture.md](../.docs/architecture.md) | 系統架構、目錄結構、資料庫 Schema、環境變數、完整流程 |
| [.docs/dev-log.md](../.docs/dev-log.md) | 開發日誌：各 session 完成項目、踩坑記錄、技術決策 |
| [.docs/todos.md](../.docs/todos.md) | 待辦清單：已完成 [x] 與未完成 [ ] 項目 |

**新 session 必讀順序**：`todos.md` → `architecture.md` → `dev-log.md`（最新條目）

---


## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

# 5. 溝通規範

- 對話總是用繁體中文回覆、唯有專有技術名詞以英文呈現（例如 v-if）

# 6. 工作流程規範

- 程式碼內容以及註解以中文撰寫，唯有專有技術名詞以英文呈現
- console 及註解不使用 emoji
- 先提供要更改的完整程式碼審查並解釋理由
- 提供新的程式碼跟舊的程式碼的比較跟差別
- 永遠不會主動要求更改專案現有的程式碼
