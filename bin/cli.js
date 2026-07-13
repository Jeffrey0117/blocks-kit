#!/usr/bin/env node
/**
 * blocks-kit — 元件收割機(零依賴 CLI)
 *
 * 金庫 = 這個 repo 自己的 blocks/ 目錄。CLI 透過本機快取 clone 讀寫金庫,
 * 所以 harvest/add 都拿得到最新內容(npx 快取裡的 blocks/ 只是舊快照,不讀它)。
 *
 *   harvest <file...>   在任何專案裡收割元件 → 進金庫(自動掃 import 記依賴)
 *   add <name>          在新專案裡播種 → 複製原始碼 + 列出要補的依賴
 *   list / search <kw>  看金庫有什麼
 *
 * env:
 *   BLOCKS_KIT_DIR   用指定目錄當金庫工作區(開發用,跳過 clone/pull/push)
 *   BLOCKS_KIT_REPO  金庫 repo 網址(預設 Jeffrey0117/blocks-kit)
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
const { kebab, scanImports, inferCategory, allBlocks } = require("../lib");

const VAULT_REPO = process.env.BLOCKS_KIT_REPO || "https://github.com/Jeffrey0117/blocks-kit.git";
const DEV_DIR = process.env.BLOCKS_KIT_DIR || null;
const CACHE_DIR = path.join(os.homedir(), ".blocks-kit", "vault");

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", windowsHide: true, ...opts });
  if (r.status !== 0 && !opts.allowFail) {
    console.error(`✗ ${cmd} ${args.join(" ")} 失敗:\n${(r.stderr || r.stdout || "").trim()}`);
    process.exit(1);
  }
  return r;
}

function vaultDir() {
  if (DEV_DIR) return DEV_DIR;
  if (!fs.existsSync(path.join(CACHE_DIR, ".git"))) {
    fs.mkdirSync(path.dirname(CACHE_DIR), { recursive: true });
    console.log("⬇ 首次使用,clone 金庫…");
    run("git", ["clone", "--depth", "1", VAULT_REPO, CACHE_DIR]);
  } else {
    run("git", ["-C", CACHE_DIR, "pull", "--ff-only"], { allowFail: true });
  }
  return CACHE_DIR;
}

function originRepo() {
  const r = spawnSync("git", ["config", "--get", "remote.origin.url"], { encoding: "utf8", windowsHide: true });
  return (r.stdout || "").trim() || "unknown";
}

function parseArgs(argv) {
  const flags = {};
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) flags[key] = argv[++i];
      else flags[key] = true;
    } else rest.push(argv[i]);
  }
  return { flags, rest };
}

function printDeps(deps) {
  if (deps.npm.length) console.log(`   📦 npm 依賴:${deps.npm.join(", ")}`);
  if (deps.shadcn.length) console.log(`   🧩 shadcn primitives:${deps.shadcn.join(", ")}`);
  if (deps.internal.length) console.log(`   ⚠️ 專案內部相依(目標專案要自備或改掉):${deps.internal.join(", ")}`);
}

// ─── harvest ───────────────────────────────────────────────────────────────
function harvest(files, flags) {
  if (!files.length) {
    console.error("用法:blocks-kit harvest <file...> [--name n] [--category c] [--desc 描述] [--no-push]");
    process.exit(1);
  }
  for (const f of files) {
    if (!fs.existsSync(f)) {
      console.error(`✗ 找不到檔案:${f}`);
      process.exit(1);
    }
  }
  const vault = vaultDir();
  const name = flags.name || kebab(path.basename(files[0]));
  const category = flags.category || inferCategory(path.resolve(files[0]));
  const dir = path.join(vault, "blocks", category, name);
  fs.mkdirSync(dir, { recursive: true });

  const merged = { npm: new Set(), shadcn: new Set(), internal: new Set(), framework: new Set() };
  const fileNames = [];
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    const d = scanImports(src);
    for (const k of Object.keys(merged)) d[k].forEach((x) => merged[k].add(x));
    fs.writeFileSync(path.join(dir, path.basename(f)), src);
    fileNames.push(path.basename(f));
  }
  const deps = Object.fromEntries(Object.entries(merged).map(([k, v]) => [k, [...v].sort()]));

  const meta = {
    name,
    category,
    description: flags.desc || "",
    origin: { repo: originRepo(), paths: files.map((f) => f.replace(/\\/g, "/")) },
    files: fileNames,
    deps,
    harvestedAt: new Date().toISOString().slice(0, 10),
  };
  fs.writeFileSync(path.join(dir, "block.json"), JSON.stringify(meta, null, 2) + "\n");

  console.log(`🌾 收割完成:${category}/${name}(${fileNames.join(", ")})`);
  printDeps(deps);

  if (!DEV_DIR && !flags["no-push"]) {
    run("git", ["-C", vault, "add", "-A"]);
    run("git", ["-C", vault, "commit", "-m", `harvest: ${category}/${name}`], { allowFail: true });
    run("git", ["-C", vault, "push"]);
    console.log("   ⬆ 已推上金庫");
  } else if (DEV_DIR) {
    console.log("   (BLOCKS_KIT_DIR 開發模式:自己 commit/push)");
  }
}

// ─── add ───────────────────────────────────────────────────────────────────
function add(names, flags) {
  if (!names.length) {
    console.error("用法:blocks-kit add <name...> [--dest 目錄] [--force]");
    process.exit(1);
  }
  const vault = vaultDir();
  const blocks = allBlocks(vault);
  for (const wanted of names) {
    const block = blocks.find((b) => b.name === wanted);
    if (!block) {
      console.error(`✗ 金庫裡沒有「${wanted}」。跑 blocks-kit list 看看有什麼。`);
      process.exit(1);
    }
    const dest = flags.dest || path.join("src", "components", block.category);
    fs.mkdirSync(dest, { recursive: true });
    for (const f of block.files) {
      const target = path.join(dest, f);
      if (fs.existsSync(target) && !flags.force) {
        console.error(`✗ ${target} 已存在(要覆蓋加 --force)`);
        process.exit(1);
      }
      fs.copyFileSync(path.join(vault, "blocks", block.category, block.name, f), target);
      console.log(`🌱 ${target}`);
    }
    printDeps(block.deps);
    if (block.deps.npm.length) console.log(`   → pnpm add ${block.deps.npm.join(" ")}`);
  }
}

// ─── list / search ─────────────────────────────────────────────────────────
function list(keyword) {
  const blocks = allBlocks(vaultDir());
  const hits = keyword
    ? blocks.filter((b) => [b.name, b.category, b.description].join(" ").toLowerCase().includes(keyword.toLowerCase()))
    : blocks;
  if (!hits.length) {
    console.log(keyword ? `沒有符合「${keyword}」的區塊。` : "金庫還是空的 — 去收割吧:blocks-kit harvest <file>");
    return;
  }
  console.log(`📚 金庫共 ${blocks.length} 顆,列出 ${hits.length} 顆:\n`);
  for (const b of hits) {
    console.log(`  ${b.category}/${b.name}  —  ${b.description || "(沒描述)"}`);
    console.log(`      files: ${b.files.join(", ")}   來源: ${b.origin.repo.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\.git$/, "")}`);
  }
  console.log(`\n播種:npx github:Jeffrey0117/blocks-kit add <name>`);
}

// ─── main ──────────────────────────────────────────────────────────────────
const [, , cmd, ...argv] = process.argv;
const { flags, rest } = parseArgs(argv);

switch (cmd) {
  case "harvest":
    harvest(rest, flags);
    break;
  case "add":
    add(rest, flags);
    break;
  case "list":
    list(null);
    break;
  case "search":
    list(rest[0] || "");
    break;
  default:
    console.log(`blocks-kit — 元件收割機

  harvest <file...> [--name n] [--category c] [--desc 描述]   收割元件進金庫
  add <name...> [--dest 目錄] [--force]                        播種到目前專案
  list                                                         看金庫全部
  search <關鍵字>                                              搜金庫
`);
}
