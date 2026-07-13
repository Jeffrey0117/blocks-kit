"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface CourseReviewListProps {
  courseId: string;
  /**
   * 2026-07-13 試衣間選型:
   * - "spotlight"(預設):有留言 → 聚光燈自動輪播;沒留言 → 五星輪播卡(文案「好到沒話說了」)
   * - "list":原本的直列清單,保留供後台元件選擇器使用
   */
  variant?: "spotlight" | "list";
}

/** 頭像底色(按索引輪替,同一人每次渲染顏色穩定) */
const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-teal-600",
  "bg-amber-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-lime-600",
];

function StarRow({ rating, className = "h-3.5 w-3.5" }: { rating: number; className?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${className} ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}

function Avatar({ name, index }: { name: string; index: number }) {
  return (
    <span
      className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-sm font-bold text-white ${
        AVATAR_COLORS[index % AVATAR_COLORS.length]
      }`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export const CourseReviewList = ({ courseId, variant = "spotlight" }: CourseReviewListProps) => {
  // 查詢已審核通過的評論
  const { data: reviews, isLoading } = useQuery({
    queryKey: ["course-reviews-public", courseId],
    queryFn: async () => {
      // 明列安全欄位（admin_note/reviewed_by 等內部欄位已對 anon 收回，不能用 select *）
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("course_reviews")
        .select("id, course_id, user_id, rating, content, status, created_at")
        .eq("course_id", courseId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      if (!reviewsData || reviewsData.length === 0) return [];

      const userIds = [...new Set(reviewsData.map((r) => r.user_id).filter(Boolean))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      const profilesMap = new Map((profilesData || []).map((p) => [p.id, p]));

      return reviewsData.map((review) => ({
        ...review,
        profiles: review.user_id ? profilesMap.get(review.user_id) || null : null,
      }));
    },
    enabled: !!courseId,
  });

  // 聚光燈輪播 index(有留言的那批)
  const [spotIdx, setSpotIdx] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);

  const texted = (reviews || []).filter((r) => r.content && r.content.trim());
  const untexted = (reviews || []).filter((r) => !r.content || !r.content.trim());

  // 自動輪播(單則就不用轉)
  useEffect(() => {
    if (variant !== "spotlight" || texted.length < 2) return;
    const t = setInterval(() => setSpotIdx((p) => (p + 1) % texted.length), 4200);
    return () => clearInterval(t);
  }, [variant, texted.length]);

  const averageRating =
    reviews && reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  if (isLoading) return null;
  if (!reviews || reviews.length === 0) return null;

  const header = (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-2xl font-bold">學員評價</h2>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold">{averageRating}</span>
        <StarRow rating={Math.round(Number(averageRating))} className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">({reviews.length} 則評價)</span>
      </div>
    </div>
  );

  if (variant === "list") {
    // 原版直列清單(保留供後台元件選擇器)
    return (
      <div>
        {header}
        <div className="space-y-3">
          {reviews.slice(0, 5).map((review) => (
            <div key={review.id} className="space-y-2 rounded-lg bg-muted/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <StarRow rating={review.rating} />
                  <span className="text-[15px] font-medium">
                    {review.profiles?.full_name || "匿名學員"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("zh-TW")}
                </span>
              </div>
              {review.content && (
                <p className="text-[15px] leading-7 text-muted-foreground">{review.content}</p>
              )}
            </div>
          ))}
          {reviews.length > 5 && (
            <p className="text-center text-sm text-muted-foreground">
              還有 {reviews.length - 5} 則評價
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── spotlight(預設):聚光燈 + 五星輪播 ──
  const slideRail = (dir: number) => {
    railRef.current?.scrollBy({ left: dir * 254, behavior: "smooth" });
  };

  return (
    <div>
      {header}

      {/* 有留言 → 聚光燈:所有引言用 grid 疊在同一格,容器高度自動 = 最長那則 → 輪播不上下跳 */}
      {texted.length > 0 && (
        <div className="relative rounded-2xl border bg-muted/30 px-8 pb-7 pt-10 text-center md:px-14">
          <span
            aria-hidden
            className="absolute left-6 top-4 font-serif text-6xl leading-none text-primary/10"
          >
            “
          </span>
          <div className="grid">
            {texted.map((review, i) => {
              const active = i === spotIdx;
              return (
                <div
                  key={review.id}
                  className={`col-start-1 row-start-1 flex flex-col items-center justify-center transition-opacity duration-300 ${
                    active ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                  aria-hidden={!active}
                >
                  <p className="mx-auto mb-4 max-w-xl text-[17px] font-medium leading-8">
                    {review.content}
                  </p>
                  <div className="flex items-center justify-center gap-2.5 text-sm text-muted-foreground">
                    <Avatar name={review.profiles?.full_name || "匿名學員"} index={i} />
                    <span className="font-semibold text-foreground">
                      {review.profiles?.full_name || "匿名學員"}
                    </span>
                    <StarRow rating={review.rating} />
                    <span>{new Date(review.created_at).toLocaleDateString("zh-TW")}</span>
                  </div>
                </div>
              );
            })}
          </div>
          {texted.length > 1 && (
            <div className="mt-5 flex justify-center gap-2">
              {texted.map((r, i) => (
                <button
                  key={r.id}
                  type="button"
                  aria-label={`第 ${i + 1} 則評價`}
                  data-active={i === spotIdx ? "true" : undefined}
                  onClick={() => setSpotIdx(i)}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                    i === spotIdx
                      ? "scale-[1.35] bg-foreground ring-4 ring-foreground/10"
                      : "bg-slate-300 hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 沒留言 → 五星輪播卡,文案統一「好到沒話說了」 */}
      {untexted.length > 0 && (
        <div className={texted.length > 0 ? "mt-4" : ""}>
          <div
            ref={railRef}
            className="scrollbar-hide flex snap-x snap-mandatory gap-3.5 overflow-x-auto pb-3"
          >
            {untexted.map((review, i) => (
              <div
                key={review.id}
                className="flex w-[240px] flex-none snap-start flex-col gap-2.5 rounded-2xl border bg-muted/30 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <span aria-hidden className="font-serif text-2xl leading-none text-muted-foreground/50">
                  “
                </span>
                <p className="flex-1 text-sm leading-7 text-muted-foreground">好到沒話說了</p>
                <div className="flex items-center gap-2.5 text-[13px]">
                  <Avatar name={review.profiles?.full_name || "匿名學員"} index={i + 2} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold">
                        {review.profiles?.full_name || "匿名學員"}
                      </span>
                      <StarRow rating={review.rating} className="h-3 w-3" />
                    </div>
                    <span className="text-xs text-muted-foreground/70">
                      {new Date(review.created_at).toLocaleDateString("zh-TW")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {untexted.length > 3 && (
            <div className="flex justify-center gap-2">
              <button
                type="button"
                aria-label="上一批評價"
                onClick={() => slideRail(-1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="下一批評價"
                onClick={() => slideRail(1)}
                className="flex h-8 w-8 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:border-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
