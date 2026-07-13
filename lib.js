/**
 * blocks-kit 核心邏輯(零依賴)— CLI 與程式化使用共用。
 */
const fs = require("fs");
const path = require("path");

// shadcn 慣例下「目標專案本來就該有」的 import,播種時只提醒、不當障礙
const FRAMEWORK_PREFIXES = ["react", "react-dom", "next"];

function kebab(s) {
  return s
    .replace(/\.[jt]sx?$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

/** 掃描原始碼的 import,分類成:npm 套件 / shadcn primitives / 專案內部相依 / 框架 */
function scanImports(source) {
  const deps = { npm: new Set(), shadcn: new Set(), internal: new Set(), framework: new Set() };
  const re = /(?:import[\s\S]*?from\s*|require\()\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(source))) {
    const spec = m[1];
    if (spec.startsWith("@/components/ui/")) deps.shadcn.add(spec.split("/").pop());
    else if (spec === "@/lib/utils") deps.shadcn.add("(lib/utils · cn)");
    else if (spec.startsWith("@/") || spec.startsWith(".")) deps.internal.add(spec);
    else if (FRAMEWORK_PREFIXES.some((p) => spec === p || spec.startsWith(p + "/"))) deps.framework.add(spec);
    else deps.npm.add(spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]);
  }
  return Object.fromEntries(Object.entries(deps).map(([k, v]) => [k, [...v].sort()]));
}

/** 從檔案路徑猜分類:.../components/<cat>/File.tsx → cat */
function inferCategory(filePath) {
  const parts = filePath.split(/[\\/]/);
  const i = parts.lastIndexOf("components");
  return i >= 0 && i < parts.length - 2 ? parts[i + 1] : "misc";
}

/** 讀出金庫(vault 目錄)裡所有 block 的 metadata */
function allBlocks(vault) {
  const root = path.join(vault, "blocks");
  if (!fs.existsSync(root)) return [];
  const out = [];
  for (const cat of fs.readdirSync(root)) {
    const catDir = path.join(root, cat);
    if (!fs.statSync(catDir).isDirectory()) continue;
    for (const name of fs.readdirSync(catDir)) {
      const metaPath = path.join(catDir, name, "block.json");
      if (fs.existsSync(metaPath)) out.push(JSON.parse(fs.readFileSync(metaPath, "utf8")));
    }
  }
  return out;
}

module.exports = { kebab, scanImports, inferCategory, allBlocks };
