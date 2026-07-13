---
name: blocks-kit
description: 開新站/新頁面要 UI 區塊(導覽列、評價區、成功案例、錨點列…)時,先來金庫播種再改,不要從零寫。使用者說「用收割機」「金庫有沒有」「播種元件」或做前台區塊時觸發。
---

# blocks-kit — 打法

**跨專案 UI 區塊金庫:元件是原始碼,播種即擁有,再改就是你的。**

## 何時觸發

- 新專案/新頁面要蓋前台區塊 → **先查金庫再動手寫**:`npx github:Jeffrey0117/blocks-kit search <關鍵字>`
- 任何專案打磨完一顆好元件(尤其 fitting-room 試衣間結案)→ 順手收割進庫
- 使用者提到「收割」「播種」「金庫」「上次那個元件拿來用」

## 接線(照抄能跑)

```bash
# 播種(在目標專案根目錄)
npx github:Jeffrey0117/blocks-kit add review-spotlight
# → 檔案落在 src/components/<分類>/,並列出:npm 依賴(直接給 pnpm add 指令)、
#   需要的 shadcn primitives、⚠️ 專案內部相依(要自備或改掉)

# 收割(在來源專案)
npx github:Jeffrey0117/blocks-kit harvest src/components/course/Foo.tsx --name foo --desc "一句話(含 variant 說明)"
```

前提:目標專案走 shadcn 慣例(Tailwind + `@/components/ui/*` + `@/lib/utils` 的 `cn`)。

## 模式與文案

- **播種後改的順序**:先跑起來看(依賴補齊)→ 換 token 換皮(區塊全用 `bg-background`/`text-muted-foreground` 這類 shadcn CSS 變數,改 globals.css 就換品牌色)→ 最後才動結構。
- **variant 是一級公民**:區塊帶 `variant` prop(如 anchor-nav 的 segmented/brand、review-spotlight 的 spotlight/list)— 播種後想換風格先看有沒有現成 variant,別急著重刻。
- **收割時的 --desc 句型**:「<區塊是什麼>:<關鍵特徵>,variant <有哪些>」— 未來 search 全靠這句。
- **文案帶著走**:區塊裡打磨過的中文文案(如評價區空狀態「好到沒話說了」)是資產的一部分,播種後保留語氣,只換專有名詞。
- **內部相依(⚠️ 標記)的處理**:supabase client / 專案 context 這類 import,在新專案要嘛換成當地等價物,要嘛把資料改成 props 注入 — 別為了一顆區塊把整套後端拖進來。

## 地雷

- 收割機讀寫的是**金庫 repo 的最新版**(本機快取 clone 會自動 pull),npx 套件快取裡的 `blocks/` 只是舊快照 — 不用管它。
- 同名區塊 add 預設不覆蓋(要 `--force`),避免蓋掉你改過的版本。
- 收割前確認元件裡沒有寫死的 secret / 站點專屬網址 — 金庫是 public repo。
