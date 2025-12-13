import { cn } from "@/lib/utils";
import { Spinner } from "./ui/spinner";

export function LoadingPage({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid h-[calc(100vh-7rem)] w-full place-content-center",
        className
      )}
    >
      <Spinner className="size-6 text-primary" />
    </div>
  );
}
