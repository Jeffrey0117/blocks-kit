import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/**
 * 行銷首頁「成功案例」區(2026-07-13)。
 * 主打切版職人(htmlcat2025,六位數營收);其餘為進駐創作者展示。
 * 純靜態內容 — 案例是行銷素材,不從 DB 撈(要換案例直接改這份名單)。
 */

const FEATURED = {
  slug: "htmlcat2025",
  name: "切版職人",
  site: "前端切板職人課程網",
  avatar: "https://i.urusai.cc/eUTrQ.png",
  metric: "六位數",
  metricUnit: "台幣課程營收",
  quote:
    "課程上架、金流、學員管理到行銷素材,全部在同一個平台搞定。我把課放上 Classroo,一路做到六位數營收。",
};

const CREATORS = [
  { slug: "yasac", name: "呀沙係", site: "《呀沙係・引力》", avatar: "/case-studies/yasac.png" },
  { slug: "minz", name: "鄭閔之", site: "一人事業學院小教室", avatar: "/case-studies/minz.png" },
  { slug: "catsoc", name: "文科橘貓", site: "文科橘貓", avatar: "/case-studies/catsoc.png" },
  { slug: "cablate", name: "CabLate", site: "Cab-Coding", avatar: "/case-studies/cablate.png" },
];

export function CaseStudies({ showHeading = true }: { showHeading?: boolean } = {}) {
  return (
    // 首頁模式(showHeading)自帶大留白;獨立頁上方已有 hero,只留小間距否則中間空一大段
    <section className={`reveal bg-background ${showHeading ? "py-20 md:py-28" : "pb-20 pt-4 md:pb-28"}`}>
      <div className="container mx-auto max-w-5xl px-4">
        {showHeading && (
          <>
            <h2 className="text-center text-4xl md:text-5xl font-black leading-tight">成功案例</h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-base md:text-lg text-muted-foreground leading-relaxed">
              真實創作者,在 Classroo 把知識變成生意。
            </p>
          </>
        )}

        {/* 主打:切版職人 */}
        <Link
          href={`/${FEATURED.slug}`}
          className={`group block overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white shadow-xl transition-transform duration-300 hover:-translate-y-1 ${showHeading ? "mt-12" : ""}`}
        >
          <div className="grid items-center gap-8 p-8 md:grid-cols-[auto,1fr] md:p-12">
            <div className="flex flex-col items-center gap-4 text-center md:w-52">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={FEATURED.avatar}
                alt={FEATURED.name}
                width={112}
                height={112}
                className="h-28 w-28 rounded-full border-4 border-white/15 object-cover shadow-lg"
              />
              <div>
                <p className="text-lg font-bold">{FEATURED.name}</p>
                <p className="text-sm text-white/60">{FEATURED.site}</p>
              </div>
              <span className="rounded-full bg-teal-400/15 px-4 py-1.5 text-sm font-bold text-teal-300">
                NT$ {FEATURED.metric}・{FEATURED.metricUnit}
              </span>
            </div>
            <div>
              <span aria-hidden className="font-serif text-6xl leading-none text-teal-400/30">
                “
              </span>
              <p className="text-xl font-medium leading-9 md:text-2xl md:leading-10">
                {FEATURED.quote}
              </p>
              <p className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-300">
                看看他的課程網
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </p>
            </div>
          </div>
        </Link>

        {/* 進駐創作者 */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {CREATORS.map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-teal-500/40 hover:shadow-lg"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.avatar}
                alt={c.name}
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-full object-cover"
              />
              <div>
                <p className="font-bold">{c.name}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{c.site}</p>
              </div>
              <span className="text-xs font-semibold text-teal-600 opacity-0 transition-opacity group-hover:opacity-100">
                逛逛他的店 →
              </span>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-base md:text-lg font-semibold text-muted-foreground">
          下一個成功案例,就是
          <Link href="/classroo/create-tenant" className="mx-1 font-black text-teal-600 underline underline-offset-4 hover:text-teal-500">
            你的名字
          </Link>
        </p>
      </div>
    </section>
  );
}
