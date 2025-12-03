import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { QueryProvider } from "@/components/query-provider";
import { auth } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  return (
    <QueryProvider>
      <div className="mx-auto max-w-7xl p-8">{children}</div>
    </QueryProvider>
  );
}
