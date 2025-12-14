"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
    title: "Review SEO",
    prompt: "Review my technical SEO checklist and highlight priority fixes.",
  },
] as const;

export default function Page() {
  const router = useRouter();
  const session = useSession();
  const [input, setInput] = useState("");
  const queryClient = useQueryClient();
  const createThread = useMutation({
    mutationFn: ({ firstMessage }: { firstMessage: string }) =>
      createChatThread(firstMessage),
  });

  const greeting = getGreeting(session.data?.user?.name);

  const submitText = async (text: string) => {
    const result = await createThread.mutateAsync({
      firstMessage: text,
    });
    if (!result.success) {
      toast.error(result.error.message);
      return;
    }
    queryClient.refetchQueries({ queryKey: ["sidebar-data"] });
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
      <div className="mt-20 space-y-1">
        <h1 className="text-center text-3xl tracking-tight">{greeting}</h1>
        <p className="mt-2 text-center text-muted-foreground">
          Have any questions? Just chat below.
        </p>
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

      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          If you're not sure where to start, try these:
        </p>
        <div className="grid gap-3 md:grid-cols-4">
          {suggestions.map((s) => (
            <Card
              className="cursor-pointer p-3 hover:shadow-md"
              key={s.title}
              onClick={() => submitText(s.prompt)}
              role="button"
              tabIndex={0}
            >
              <CardHeader className="p-0">
                <CardTitle className="text-muted-foreground">
                  {s.icon}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="font-medium text-sm">{s.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
