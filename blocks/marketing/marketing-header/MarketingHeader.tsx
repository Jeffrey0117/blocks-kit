"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BookOpen, LayoutDashboard, LogOut, Loader2, Menu, X } from "lucide-react";
import { useAuth } from "@/providers";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { label: "功能特色", href: "/#features" },
  { label: "價格方案", href: "/#pricing" },
  { label: "成功案例", href: "/case-studies" },
  { label: "開課指南", href: "/blog" },
  { label: "常見問題", href: "/#faq" },
  { label: "關於我們", href: "/about" },
];

export function MarketingHeader() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 查詢用戶擁有的租戶
  const { data: ownedTenants } = useQuery({
    queryKey: ["owned-tenants", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from("tenants")
        .select("id, name, slug")
        .eq("owner_id", user.id)
        .eq("is_active", true);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // 查詢用戶 profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/favicon.png" alt="Classroo" className="h-9 w-9 rounded-full" />
          <span className="text-2xl font-bold">Classroo</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons - Desktop */}
        <div className="hidden md:flex gap-3 items-center">
          {authLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : user ? (
            <>
              {/* 有租戶：顯示「管理後台」 */}
              {ownedTenants && ownedTenants.length > 0 && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/${ownedTenants[0].slug}/admin`}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    管理後台
                  </Link>
                </Button>
              )}

              {/* 用戶下拉選單 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback>
                        {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium truncate">
                    {profile?.full_name || user.email}
                  </div>
                  <DropdownMenuSeparator />
                  {ownedTenants && ownedTenants.length > 0 ? (
                    <>
                      {ownedTenants.map((tenant) => (
                        <DropdownMenuItem key={tenant.id} asChild>
                          <Link href={`/${tenant.slug}/admin`}>
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            {tenant.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/classroo/pricing">
                          <BookOpen className="h-4 w-4 mr-2" />
                          建立我的網站
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      handleSignOut();
                    }}
                    className="text-red-600 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/login">登入</Link>
              </Button>
              <Button asChild>
                <Link href="/classroo/pricing">立即購買</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[350px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Classroo
              </SheetTitle>
            </SheetHeader>

            <div className="mt-8 flex flex-col gap-4">
              {/* Navigation Links */}
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center py-3 px-4 rounded-lg text-foreground hover:bg-muted transition-colors font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="border-t my-2" />

              {/* Auth Section */}
              {authLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : user ? (
                <div className="flex flex-col gap-2">
                  {/* User Info */}
                  <div className="flex items-center gap-3 py-3 px-4 bg-muted/50 rounded-lg">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback>
                        {profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{profile?.full_name || "用戶"}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Tenant Links */}
                  {ownedTenants && ownedTenants.length > 0 ? (
                    ownedTenants.map((tenant) => (
                      <Link
                        key={tenant.id}
                        href={`/${tenant.slug}/admin`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-muted transition-colors"
                      >
                        <LayoutDashboard className="h-5 w-5 text-primary" />
                        <span>{tenant.name}</span>
                      </Link>
                    ))
                  ) : (
                    <Link
                      href="/classroo/pricing"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-muted transition-colors"
                    >
                      <BookOpen className="h-5 w-5 text-primary" />
                      <span>建立我的網站</span>
                    </Link>
                  )}

                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center gap-3 py-3 px-4 rounded-lg hover:bg-red-50 text-red-600 transition-colors w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>登出</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      登入
                    </Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/classroo/pricing" onClick={() => setMobileMenuOpen(false)}>
                      立即購買
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
