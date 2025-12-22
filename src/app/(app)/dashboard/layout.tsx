import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppBreadcrumb } from "@/components/app-breadcrumb";
import { QueryProvider } from "@/components/query-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { setDefaultDomain } from "@/lib/actions";
import { auth } from "@/lib/auth";
import { AppSidebar } from "./components/app-sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });

  if (!session) {
    redirect("/sign-in");
  }

  if (!session.session.activeDomain) {
    await setDefaultDomain(session);
  }

  return (
    <QueryProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <AppBreadcrumb />
          <div className="mx-auto w-full max-w-6xl py-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </QueryProvider>
  );
}
