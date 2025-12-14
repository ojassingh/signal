"use client";

import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, Square } from "lucide-react";
import { redirect, useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getChatThread } from "@/actions/chat";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ai/prompt-input";
import { LoadingPage } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { isValidUUID } from "@/lib/utils";
import { ChatMessage } from "./chat-helpers";

const getThreadIdFromParam = (param: string | string[] | undefined) =>
  Array.isArray(param) ? (param[0] ?? "") : (param ?? "");

export default function Page() {
  const params = useParams();
  const threadId = getThreadIdFromParam(params.threadId);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const initSentRef = useRef<string | null>(null);
  const [input, setInput] = useState("");

  const invalidThreadId = Boolean(threadId) && !isValidUUID(threadId);

  const { data, isLoading: isThreadLoading } = useQuery({
    queryKey: ["chat-thread", threadId],
    queryFn: () => getChatThread(threadId),
    enabled: !!threadId && !invalidThreadId,
    retry: false,
  });

  const { messages, sendMessage, setMessages, status, stop } = useChat({
    onError: (error) => {
      toast.error(error.message || "Something went wrong.");
    },
  });

  const isLoading = status === "submitted";
  const thread = data?.success ? data.data : null;

  useEffect(() => {
    if (!thread) {
      return;
    }
    setMessages(thread.messages ?? []);
    if (initSentRef.current === threadId) {
      return;
    }
    initSentRef.current = threadId;
    const key = `chat:init:${threadId}`;
    const text = sessionStorage.getItem(key);
    if (text?.trim()) {
      sessionStorage.removeItem(key);
      sendMessage({ text }, { body: { threadId } });
    }
  }, [sendMessage, setMessages, thread, threadId]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  if (isThreadLoading) {
    return <LoadingPage />;
  }

  if (invalidThreadId) {
    redirect("/dashboard/chat?error=CHAT_THREAD_NOT_FOUND");
  }

  if (!data) {
    return null;
  }

  if (!data.success) {
    redirect(`/dashboard/chat?error=${encodeURIComponent(data.error.code)}`);
  }

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isLoading) {
      return;
    }
    setInput("");
    await sendMessage({ text }, { body: { threadId } });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-3xl flex-col gap-4">
      <div className="flex flex-1 flex-col gap-3 pt-4 pb-40">
        {messages.map((message, index) => (
          <ChatMessage
            key={message.id || `message-${index}`}
            message={message}
          />
        ))}
        {isLoading ? <TextShimmer>Thinking...</TextShimmer> : null}
      </div>
      <div ref={bottomRef} />
      <div className="fixed inset-x-0 bottom-8 z-0 pl-(--sidebar-width)">
        <div className="mx-auto w-full max-w-3xl px-4">
          <PromptInput
            className="w-full"
            isLoading={isLoading}
            onSubmit={handleSubmit}
            onValueChange={setInput}
            value={input}
          >
            <PromptInputTextarea placeholder="Ask about your traffic, growth ideas, or research anything…" />
            <PromptInputActions className="justify-end">
              <PromptInputAction
                tooltip={isLoading || status === "streaming" ? "Stop" : "Send"}
              >
                <Button
                  className="rounded-full bg-primary text-primary-foreground"
                  onClick={() => {
                    if (isLoading || status === "streaming") {
                      stop();
                    } else {
                      handleSubmit();
                    }
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  {isLoading || status === "streaming" ? (
                    <Square className="size-4" fill="white" />
                  ) : (
                    <ArrowUp />
                  )}
                </Button>
              </PromptInputAction>
            </PromptInputActions>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
