"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Globe2 } from "lucide-react";
import { toast } from "sonner";
import { getUserSites, setActiveDomain } from "@/actions/domains";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSession, useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function DomainSwitcher() {
  const queryClient = useQueryClient();
  const session = useSession();
  const activeDomain = session.data?.session.activeDomain;
  const { data: sitesData } = useQuery({
    queryKey: ["user-sites"],
    queryFn: getUserSites,
    staleTime: 5 * 60 * 1000,
    enabled: !!session.data,
  });

  const sites = sitesData?.success ? sitesData.data : [];
  const { mutate, isPending } = useMutation({
    mutationFn: (domain: string) => setActiveDomain(domain),
    onSuccess: async (result) => {
      if (result.success) {
        await getSession({ query: { disableCookieCache: true } });
        await session.refetch();
        queryClient.invalidateQueries({ queryKey: ["user-sites"] });
        toast.success(`Active domain set to ${result.data.activeDomain}`);
      } else {
        toast.error(`Failed to set active domain: ${result.error.message}`);
      }
    },
  });

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
            <span>{activeDomain}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {sites.map((site) => {
          const selected = site.domain === activeDomain;
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
