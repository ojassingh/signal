"use client";

import { useQuery } from "@tanstack/react-query";
import { map } from "lodash";
import {
  BarChart3,
  History,
  MessageCirclePlus,
  PencilRuler,
  Sparkles,
  Text,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type * as React from "react";
import { getUserChatThreads } from "@/actions/chat";
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
import { useSession } from "@/lib/auth-client";
import { DomainSwitcher } from "./domain-switcher";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const session = useSession();
  const activeDomain = session.data?.session.activeDomain;

  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ["chat-threads", activeDomain],
    queryFn: getUserChatThreads,
    staleTime: 5 * 60 * 1000,
    enabled: !!session.data && !!activeDomain,
  });

  const threads = threadsData?.success ? threadsData.data : [];

  return (
    <Sidebar className="min-h-screen" collapsible="none" {...props}>
      <SidebarHeader>
        <DomainSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Agent</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0">
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={
                    pathname === "/dashboard/chat" ||
                    pathname.startsWith("/dashboard/chat/")
                  }
                >
                  <Link href="/dashboard/chat">
                    <MessageCirclePlus />
                    <span>Chat</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {threadsLoading
                ? map(new Array(3), (_, index) => (
                    <SidebarMenuItem key={index}>
                      <Skeleton className="h-6 w-full rounded-lg" />
                    </SidebarMenuItem>
                  ))
                : threads.map((t) => (
                    <SidebarMenuItem key={t.threadId}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === `/dashboard/chat/${t.threadId}`}
                      >
                        <Link
                          className="text-muted-foreground text-sm"
                          href={`/dashboard/chat/${t.threadId}`}
                        >
                          <History className="" />
                          <span className="">{t.title ?? "Untitled"}</span>
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>AI Search</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/ai-search")}
                >
                  <Link href="/dashboard/ai-search">
                    <Sparkles />
                    <span>Evals</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/prompts")}
                >
                  <Link href="/dashboard/prompts">
                    <Text />
                    <span>Prompts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/dashboard/content")}
                >
                  <Link href="/dashboard/content">
                    <PencilRuler />
                    <span>Content</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
