"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowUp, Check, FilePen, Gpu, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createChatThread } from "@/actions/chat";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ai/prompt-input";
import { LoadingPage } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "@/lib/auth-client";
import { getGreeting } from "@/lib/utils";

const suggestions = [
  {
    icon: <FilePen className="size-5" />,
    title: "Audit my homepage",
    prompt: "Audit my homepage and give me 5 high-impact improvements.",
  },
  {
    icon: <Gpu className="size-5" />,
    title: "Generate an llms.txt",
    prompt: "Generate an llms.txt for my site and explain where to place it.",
  },
  {
    icon: <Users className="size-5" />,
    title: "Analyze competitors",
    prompt: "Analyze my competitors and propose positioning + SEO angles.",
  },
  {
    icon: <Check className="size-5" />,
    title: "Review technical SEO",
    prompt: "Review my technical SEO checklist and highlight priority fixes.",
  },
] as const;

export default function Page() {
  const router = useRouter();
  const session = useSession();
  const [input, setInput] = useState("");

  const createThread = useMutation({
    mutationFn: (domain: string) => createChatThread(domain),
  });

  const greeting = getGreeting(session.data?.user?.name);

  const submitText = async (text: string) => {
    const domain = session.data?.session.activeDomain;
    if (!domain) {
      toast.error("Select an active domain first.");
      return;
    }

    const result = await createThread.mutateAsync(domain);
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }

    sessionStorage.setItem(`chat:init:${result.data.threadId}`, text);
    router.push(`/dashboard/chat/${result.data.threadId}`);
  };

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || createThread.isPending) {
      return;
    }
    setInput("");
    await submitText(text);
  };

  if (session.isPending || session.isRefetching) {
    return <LoadingPage />;
  }

  return (
    <div className="mx-auto grid h-[calc(100svh-20rem)] w-full max-w-3xl place-content-center gap-6 bg-background">
      <div className="space-y-1">
        <h1 className="text-center text-3xl tracking-tight">{greeting}</h1>
        <p className="text-center text-muted-foreground">
          Want an update or have a question? Just chat below.
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {suggestions.map((s) => (
            <Card
              className="cursor-pointer gap-0 hover:shadow-md"
              key={s.title}
              onClick={() => setInput(s.prompt)}
              role="button"
              tabIndex={0}
            >
              <CardHeader>
                <CardTitle>{s.icon}</CardTitle>
              </CardHeader>
              <CardContent>
                {s.title}
                <p className="text-muted-foreground text-sm">{s.prompt}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <PromptInput
        disabled={createThread.isPending}
        isLoading={createThread.isPending}
        onSubmit={handleSubmit}
        onValueChange={setInput}
        value={input}
      >
        <PromptInputTextarea placeholder="Ask about your traffic, growth ideas, or research anything…" />
        <PromptInputActions className="justify-end">
          <PromptInputAction tooltip="Send">
            <Button
              className="rounded-full bg-primary text-primary-foreground"
              disabled={!input.trim() || createThread.isPending}
              onClick={handleSubmit}
              size="icon"
              type="button"
              variant="ghost"
            >
              {createThread.isPending ? (
                <Spinner className="size-4" />
              ) : (
                <ArrowUp />
              )}
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
    </div>
  );
}
