<p align="center">
  <img src="logo.svg" width="96" height="96" alt="blocks-kit logo">
</p>

# blocks-kit 🌾

**元件收割機 — 跨專案 UI 區塊金庫。** 在任何專案裡把打磨好的元件「收割」進這個 repo;開新專案時「播種」回去 — 元件是原始碼,引入即擁有,再改就是你的。零依賴 CLI(node 內建 + git)。

哲學 = shadcn copy-paste 模式的私人化:不發 npm 套件、沒有版本同步地獄。金庫裡每一顆都是真實專案打磨過的實戰品。

## 用法

### 收割(在來源專案裡跑)

```bash
npx github:Jeffrey0117/blocks-kit harvest src/components/course/CourseReviewList.tsx \
  --name review-spotlight --desc "評價區:聚光燈輪播(有留言)+ 五星卡片槽(沒留言)"
```

- 自動掃 import 分類依賴:npm 套件 / shadcn primitives / 專案內部相依(⚠️ 播種時要自備或改掉)
- 名稱、分類可省略:從檔名 kebab 化、從 `components/<分類>/` 路徑推
- 收完自動 commit + push 進金庫(`--no-push` 可關)
- 多檔元件:`harvest a.tsx b.tsx --name my-block`

### 播種(在目標專案裡跑)

```bash
npx github:Jeffrey0117/blocks-kit add review-spotlight
# 🌱 src/components/course/CourseReviewList.tsx
#    📦 npm 依賴:lucide-react        → pnpm add lucide-react
#    🧩 shadcn primitives:button …   → 專案要有這些 ui 元件
#    ⚠️ 專案內部相依:@/hooks/xxx     → 自備或改掉
```

預設放到 `src/components/<分類>/`,`--dest` 換位置,`--force` 覆蓋。

### 找東西

```bash
npx github:Jeffrey0117/blocks-kit list
npx github:Jeffrey0117/blocks-kit search 評價
```

## 前提(目標專案)

區塊們走 **shadcn 慣例**:Tailwind + `@/components/ui/*` primitives + `@/lib/utils` 的 `cn`。樣式全用 shadcn CSS 變數(`bg-background`、`text-muted-foreground`…),換皮 = 換 token,不用改元件。

## 金庫結構

```
blocks/<分類>/<名稱>/
  ├─ Component.tsx   ← 原始碼原樣保存
  └─ block.json      ← 描述、來源專案、依賴分類、收割日期
```

## 程式化 API

```js
const { scanImports, allBlocks, inferCategory, kebab } = require("blocks-kit");
```

## env

| 變數 | 用途 |
|---|---|
| `BLOCKS_KIT_DIR` | 用本機目錄當金庫工作區(開發用,跳過 clone/pull/push) |
| `BLOCKS_KIT_REPO` | 換金庫 repo(預設這個 repo) |

## 相關

- 成套領域元件(聊天 UI)→ [chat-ui-kit](https://github.com/Jeffrey0117/chat-ui-kit)
- kit 生態總管 → [kit-kit](https://github.com/Jeffrey0117/kit-kit)

## License

MIT © Jeffrey0117
