"use client";

import { useQuery } from "@tanstack/react-query";
import { head, split } from "lodash";
import { useRouter } from "next/navigation";
import { getUserSites } from "@/actions/sites";
import { AddSiteDialog } from "@/app/(app)/dashboard/components/add-site-dialog";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";

export default function DashboardPage() {
  const { data: result, isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: getUserSites,
  });
  const { data: session } = useSession();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="grid h-screen w-full place-content-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (!result?.success) {
    return <div>Error loading sites</div>;
  }

  const sites = result.data;
  const name = head(split(session?.user.name, " "));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl">Welcome back, {name}!</h1>
        <AddSiteDialog />
      </div>

      {sites.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <Card
              className="cursor-pointer transition-colors hover:bg-accent"
              key={site.id}
              onClick={() => router.push(`/dashboard/${site.id}`)}
            >
              <CardHeader>
                <CardTitle>{site.name}</CardTitle>
                <p className="text-muted-foreground text-sm">{site.domain}</p>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          No sites yet. Add your first site to get started.
        </div>
      )}
    </div>
  );
}
