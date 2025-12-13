"use client";

import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import type { UIMessage } from "ai";
import { ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getSidebarData } from "@/actions/sites";
import { LoadingPage } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { cn, getDayPart, getFirstName } from "@/lib/utils";

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60 [animation-delay:-0.3s] motion-safe:animate-pulse" />
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60 [animation-delay:-0.15s] motion-safe:animate-pulse" />
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60 motion-safe:animate-pulse" />
    </span>
  );
}

function MessageText({ parts }: { parts: UIMessage["parts"] }) {
  const text = parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-muted prose-pre:text-foreground prose-code:before:content-none prose-code:after:content-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
        {text}
      </ReactMarkdown>
    </div>
  );
}

const suggestions = [
  {
    title: "Audit my homepage",
    prompt: "Audit my homepage and give me 5 high-impact improvements.",
  },
  {
    title: "Generate an llms.txt",
    prompt: "Generate an llms.txt for my site and explain where to place it.",
  },
  {
    title: "Analyze competitors",
    prompt: "Analyze my competitors and propose positioning + SEO angles.",
  },
  {
    title: "Review technical SEO",
    prompt: "Review my technical SEO checklist and highlight priority fixes.",
  },
] as const;

export function AssistantChat() {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");

  const {
    data,
    isLoading: isSidebarLoading,
    isFetching,
  } = useQuery({
    queryKey: ["sidebar-data"],
    queryFn: getSidebarData,
  });

  const sidebar = data?.success ? data.data : null;
  const firstName = getFirstName(sidebar?.user?.name);
  const greeting = `Good ${getDayPart()}, ${firstName ? ` ${firstName}` : ""}.`;

  const { messages, sendMessage, status } = useChat();

  const isLoading = status === "submitted" || status === "streaming";

  // biome-ignore lint/correctness/useExhaustiveDependencies: we only want to scroll to the bottom when the messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (isSidebarLoading || isFetching) {
    return <LoadingPage />;
  }

  const onPickSuggestion = async (prompt: string) => {
    await sendMessage({ text: prompt });
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-center text-3xl tracking-tight">{greeting}</h1>
        <p className="text-center text-muted-foreground">
          Want an update or have a question? Just chat below.
        </p>
      </div>

      <Card className="fade-in zoom-in-95 animate-in duration-300">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            Assistant
          </CardTitle>
          {sidebar?.activeDomain ? (
            <span className="text-muted-foreground text-sm">
              {sidebar.activeDomain}
            </span>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              "rounded-lg border bg-card",
              hasMessages ? "p-4" : "p-0"
            )}
          >
            {hasMessages ? (
              <div className="max-h-[50vh] space-y-4 overflow-y-auto">
                {messages.map((m) => {
                  const isUser = m.role === "user";
                  return (
                    <div
                      className={cn(
                        "flex w-full",
                        isUser ? "justify-end" : "justify-start"
                      )}
                      key={m.id}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-relaxed",
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        )}
                      >
                        <MessageText parts={m.parts} />
                      </div>
                    </div>
                  );
                })}

                {isLoading ? (
                  <div className="flex w-full justify-start">
                    <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-muted-foreground text-sm">
                      <ThinkingDots />
                    </div>
                  </div>
                ) : null}

                <div ref={bottomRef} />
              </div>
            ) : (
              <div className="space-y-4 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  {suggestions.map((s) => (
                    <button
                      className="group rounded-lg border bg-card p-4 text-left shadow-xs transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      key={s.title}
                      onClick={() => onPickSuggestion(s.prompt)}
                      type="button"
                    >
                      <div className="font-medium text-sm">{s.title}</div>
                      <div className="mt-1 text-muted-foreground text-sm">
                        {s.prompt}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form
            className="flex items-end gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const text = input.trim();
              if (!text || isLoading) {
                return;
              }
              setInput("");
              await sendMessage({ text });
            }}
          >
            <Textarea
              className="min-h-[52px] resize-none"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const text = input.trim();
                  if (!text || isLoading) {
                    return;
                  }
                  setInput("");
                  sendMessage({ text });
                }
              }}
              placeholder="Ask about your traffic, growth ideas, or research anything…"
              value={input}
            />
            <Button
              aria-label="Send"
              className="h-[52px] w-[52px] shrink-0"
              disabled={!input.trim() || isLoading}
              type="submit"
            >
              {isLoading ? <Spinner className="size-4" /> : <ArrowUp />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
