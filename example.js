// 最小範例:node example.js — 掃一段元件原始碼的依賴分類
const { scanImports, inferCategory, kebab } = require("./index");

const source = `
import Link from "next/link";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTenant } from "@/contexts/TenantContext";
`;

console.log("deps:", scanImports(source));
// → npm: ['lucide-react'], shadcn: ['(lib/utils · cn)', 'button'],
//   internal: ['@/contexts/TenantContext'], framework: ['next/link']

console.log("category:", inferCategory("src/components/course/CourseReviewList.tsx")); // → course
console.log("name:", kebab("CourseReviewList.tsx")); // → course-review-list
