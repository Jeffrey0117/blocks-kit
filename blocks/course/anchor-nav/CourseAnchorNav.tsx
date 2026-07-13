"use client";

import { useEffect, useState } from "react";

/**
 * 課程頁的頁內錨點導覽(sticky)。
 *
 * - 點擊 scrollIntoView、不寫 #hash 進歷史 → 上一頁一按就回
 * - scroll-spy:IntersectionObserver 以視窗上緣下方一小段為判定帶,
 *   捲到哪個 section 底線就跟到哪
 * - variant:2026-07-13 試衣間選型 — "segmented"(#3 分段滑槽,現行)
 *   與 "brand"(#5 品牌色暈染,保留供未來後台元件選擇器使用)
 */
interface AnchorItem {
  id: string;
  label: string;
}

type AnchorVariant = "segmented" | "brand";

export function CourseAnchorNav({
  items,
  variant = "segmented",
}: {
  items: AnchorItem[];
  variant?: AnchorVariant;
}) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      // 判定帶:視窗高度 25%~30% 的窄橫帶,一次幾乎只會有一個 section 在裡面
      { rootMargin: "-25% 0px -70% 0px" }
    );
    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [items]);

  const go = (id: string) => {
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isSegmented = variant === "segmented";

  return (
    // -mx-4 只留手機(左欄=全寬 → 滿版視覺);lg 起錨點列住在左欄內,貼齊欄寬。
    // 間距(mb)交給父層 space-y 管,自己不帶。
    <nav
      className={`sticky top-16 z-30 -mx-4 bg-background/95 px-4 py-1.5 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:mx-0 lg:px-0 ${
        isSegmented ? "" : "border-b py-0"
      }`}
    >
      <div
        className={`flex overflow-x-auto scrollbar-hide ${
          isSegmented ? "rounded-full bg-muted p-1" : ""
        }`}
      >
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item.id)}
              aria-current={active ? "true" : undefined}
              data-active={active ? "true" : undefined}
              className={
                isSegmented
                  ? `whitespace-nowrap rounded-full px-5 py-2 text-[14.5px] font-semibold transition-all md:flex-1 ${
                      active
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`
                  : `relative whitespace-nowrap rounded-t-lg px-5 py-3.5 text-[15px] font-semibold transition-colors md:flex-1 ${
                      active
                        ? "bg-primary/10 font-bold text-primary after:absolute after:inset-x-[14%] after:-bottom-px after:h-[3px] after:rounded-t-full after:bg-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`
              }
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
