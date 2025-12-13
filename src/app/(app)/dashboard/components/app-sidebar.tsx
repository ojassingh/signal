"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3, MessageCircle, Sparkles } from "lucide-react";
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
  });

  const sidebarData = data?.success ? data.data : null;
  const sites = sidebarData?.sites ?? [];
  const user = sidebarData?.user;
  const activeDomain = sidebarData?.activeDomain ?? null;

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
                <SidebarMenuButton asChild isActive={pathname === "/dashboard"}>
                  <Link href="/dashboard/">
                    <MessageCircle />
                    <span>Chat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
                    <span>Web Analytics</span>
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
