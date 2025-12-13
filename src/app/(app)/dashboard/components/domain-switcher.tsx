"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Globe2 } from "lucide-react";
import { toast } from "sonner";
import { setActiveDomain } from "@/actions/sites";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import type { Site } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DomainSwitcher({
  sites,
  activeDomain,
}: {
  sites: Site[];
  activeDomain?: string | null;
}) {
  const { state } = useSidebar();
  const queryClient = useQueryClient();
  const current =
    sites.find((site) => site.domain === activeDomain) ?? sites[0];
  const { mutate, isPending } = useMutation({
    mutationFn: (domain: string) => setActiveDomain(domain),
    onSuccess: async (result) => {
      if (result.success) {
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["sidebar-data"] }),
          queryClient.refetchQueries({ queryKey: ["active-site-stats"] }),
        ]);
        toast.success(`Active domain set to ${result.data.activeDomain}`);
      } else {
        toast.error(`Failed to set active domain: ${result.error.message}`);
      }
    },
  });

  if (!current) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="justify-between"
          disabled={isPending}
          variant="outline"
        >
          <span className="flex items-center gap-2">
            <Globe2 className="h-4 w-4" />
            {state === "expanded" && (
              <span>{current.name || current.domain}</span>
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {sites.map((site) => {
          const selected = site.domain === current.domain;
          return (
            <DropdownMenuItem
              className="flex items-center gap-2"
              disabled={isPending || selected}
              key={site.id}
              onClick={() => mutate(site.domain)}
            >
              <Check
                className={cn(
                  "h-4 w-4",
                  selected ? "opacity-100" : "opacity-0"
                )}
              />
              <div className="flex flex-col">
                <span className="text-sm">{site.name || site.domain}</span>
                <span className="text-muted-foreground text-xs">
                  {site.domain}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
