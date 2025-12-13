"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, MessageCircle, PlusSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { getSidebarData } from "@/actions/sites";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { DomainSwitcher } from "./domain-switcher";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data, isLoading } = useQuery({
    queryKey: ["sidebar-data"],
    queryFn: getSidebarData,
    staleTime: 5 * 60 * 1000,
  });

  const sidebarData = data?.success ? data.data : null;
  const sites = sidebarData?.sites ?? [];
  const user = sidebarData?.user;
  const activeDomain = sidebarData?.activeDomain ?? null;
  const threads = sidebarData?.threads ?? [];

  let headerContent: React.ReactNode = (
    <Skeleton className="h-12 w-full rounded-lg" />
  );
  if (!isLoading) {
    headerContent =
      sites.length === 0 ? (
        <Skeleton className="h-12 w-full rounded-lg" />
      ) : (
        <DomainSwitcher activeDomain={activeDomain} sites={sites} />
      );
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>{headerContent}</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Agent</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={
                    pathname === "/dashboard/chat" ||
                    pathname.startsWith("/dashboard/chat/")
                  }
                >
                  <Link href="/dashboard/chat">
                    <PlusSquare />
                    <span>Chat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {threads.map((t) => (
                <SidebarMenuItem key={t.threadId}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === `/dashboard/chat/${t.threadId}`}
                  >
                    <Link href={`/dashboard/chat/${t.threadId}`}>
                      <MessageCircle />
                      <span>{t.title ?? "Untitled"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Analytics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/analytics")}
                >
                  <Link href="/dashboard/analytics">
                    <BarChart3 />
                    <span>Web Traffic</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/ai-search")}
                >
                  <Link href="/dashboard/ai-search">
                    <Sparkles />
                    <span>AI Search</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {isLoading ? (
          <Skeleton className="mx-2 h-12 rounded-lg" />
        ) : (
          <NavUser user={user} />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
