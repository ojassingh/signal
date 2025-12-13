"use client";

import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { ArrowUp } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { getChatThread } from "@/actions/chat";
import { Message, MessageContent } from "@/components/ai/message";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ai/prompt-input";
import { LoadingPage } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.threadId as string;
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const initSentRef = useRef<string | null>(null);
  const [input, setInput] = useState("");

  const { data, isLoading: isThreadLoading } = useQuery({
    queryKey: ["chat-thread", threadId],
    queryFn: () => getChatThread(threadId),
    enabled: !!threadId,
  });

  const { messages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "submitted" || status === "streaming";
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
    if (messages.length === 0 && !isLoading) {
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isLoading]);

  if (isThreadLoading) {
    return <LoadingPage />;
  }

  if (!data) {
    return null;
  }

  if (!data.success) {
    router.push("/dashboard/chat");
    toast.error(data.error.message);
    return null;
  }

  const submitText = async (text: string) => {
    await sendMessage({ text }, { body: { threadId } });
  };

  const handleSubmit = async () => {
    const text = input.trim();
    if (!text || isLoading) {
      return;
    }
    setInput("");
    await submitText(text);
  };

  const getMessageText = (m: (typeof messages)[number]) => {
    const parts = m.parts ?? [];
    return parts
      .map((p) => (p.type === "text" ? p.text : ""))
      .join("")
      .trim();
  };

  return (
    <div className="mx-auto flex min-h-[calc(100svh-10rem)] w-full max-w-4xl flex-col gap-4">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-4">
        {messages.map((m) => {
          const text = getMessageText(m);
          const isUser = m.role === "user";
          if (!text) {
            return null;
          }
          return (
            <div className={cn("flex", isUser ? "justify-end" : "")} key={m.id}>
              <Message
                className={cn(isUser ? "flex-row-reverse" : "")}
                isUser={isUser}
              >
                <MessageContent
                  className={cn(isUser ? "bg-secondary" : "")}
                  markdown={!isUser}
                >
                  {text}
                </MessageContent>
              </Message>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <PromptInput
        className="sticky bottom-6"
        disabled={isLoading}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onValueChange={setInput}
        value={input}
      >
        <PromptInputTextarea placeholder="Ask about your traffic, growth ideas, or research anything…" />
        <PromptInputActions className="justify-end">
          <PromptInputAction tooltip="Send">
            <Button
              className="rounded-full bg-primary text-primary-foreground"
              disabled={!input.trim() || isLoading}
              onClick={handleSubmit}
              size="icon"
              type="button"
              variant="ghost"
            >
              {isLoading ? <Spinner className="size-4" /> : <ArrowUp />}
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
    </div>
  );
}
