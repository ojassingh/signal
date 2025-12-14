"use client";

import type { UIMessage } from "ai";
import { Hammer } from "lucide-react";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtItem,
  ChainOfThoughtStep,
  ChainOfThoughtTrigger,
} from "@/components/ai/chain-of-thought";
import { Message, MessageContent } from "@/components/ai/message";
import { Source, SourceContent, SourceTrigger } from "@/components/ai/source";
import {
  Steps,
  StepsBar,
  StepsContent,
  StepsItem,
  StepsTrigger,
} from "@/components/ai/steps";
import { TextShimmer } from "@/components/ui/text-shimmer";
import type {
  DataPart,
  DynamicToolPart,
  Part,
  SourceUrlPart,
  ToolPart,
} from "@/lib/types";

export type SourceLink = {
  href: string;
  title: string;
  description: string;
};

export type AssistantExtras = {
  sources: SourceLink[];
  tools: (ToolPart | DynamicToolPart)[];
  thoughts: string[];
  has: boolean;
};

const trim = (v: string | undefined) => (typeof v === "string" ? v.trim() : "");

export const getMessageText = (message: UIMessage) =>
  (message.parts ?? [])
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();

const isToolPart = (p: Part): p is ToolPart => p.type.startsWith("tool-");

const toolName = (t: ToolPart | DynamicToolPart) =>
  t.type === "dynamic-tool" ? trim(t.toolName) || "tool" : t.type.slice(5);

const norm = (v: string | undefined) => trim(v).toLowerCase();

const isToolBusy = (t: ToolPart | DynamicToolPart) => {
  if (t.type === "dynamic-tool") {
    const st = norm(t.state);
    return (
      st === "" ||
      st === "running" ||
      st === "pending" ||
      st === "submitted" ||
      st === "in_progress" ||
      st === "in-progress" ||
      st === "processing" ||
      st === "working"
    );
  }
  if (trim(t.errorText)) {
    return false;
  }
  if (t.output !== undefined) {
    return false;
  }
  const st = norm(String(t.state));
  if (
    st.includes("output") ||
    st.includes("result") ||
    st.includes("done") ||
    st.includes("complete") ||
    st.includes("finished")
  ) {
    return false;
  }
  return true;
};

const toolStepLine = (t: ToolPart | DynamicToolPart) => {
  const name = toolName(t);
  const err = t.type === "dynamic-tool" ? "" : trim(t.errorText);
  if (err) {
    return `Failed: ${name}`;
  }
  if (!isToolBusy(t)) {
    return `Done: ${name}`;
  }
  return `Running: ${name}`;
};

const getThoughtTexts = (parts: Part[]) =>
  parts
    .filter((p): p is DataPart => p.type.startsWith("data-"))
    .filter((p) => {
      const key = p.type.slice(5);
      return (
        key === "reasoning" || key === "chain-of-thought" || key === "thoughts"
      );
    })
    .map((p) => p.data)
    .filter((d): d is string => typeof d === "string" && trim(d).length > 0)
    .map((d) => trim(d));

const getSourceLinks = (parts: Part[]) =>
  parts
    .filter((p): p is SourceUrlPart => p.type === "source-url")
    .map((p) => {
      const url = trim(p.url);
      if (!url.length) {
        return null;
      }
      const title = trim(p.title);
      return { href: url, title: title || url, description: url };
    })
    .filter((x): x is SourceLink => !!x);

const isAnyToolPart = (p: Part): p is ToolPart | DynamicToolPart =>
  p.type === "dynamic-tool" || isToolPart(p);

export const getAssistantExtras = (parts: Part[]): AssistantExtras => {
  const sources = getSourceLinks(parts);
  const tools = parts.filter(isAnyToolPart);
  const thoughts = getThoughtTexts(parts);
  return {
    sources,
    tools,
    thoughts,
    has: sources.length + tools.length + thoughts.length > 0,
  };
};

export function SourcesRow({
  messageId,
  sources,
}: {
  messageId: string;
  sources: SourceLink[];
}) {
  if (sources.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2 pl-2">
      {sources.map((s, index) => (
        <Source
          href={s.href}
          key={`${messageId}:source:${s.href}:${index.toString()}`}
        >
          <SourceTrigger label={index + 1} showFavicon />
          <SourceContent description={s.description} title={s.title} />
        </Source>
      ))}
    </div>
  );
}

export function StepsBlock({
  messageId,
  tools,
}: {
  messageId: string;
  tools: (ToolPart | DynamicToolPart)[];
}) {
  if (tools.length === 0) {
    return null;
  }
  const label = tools.length === 1 ? toolName(tools[0]) : "Steps";
  const busy = tools.some(isToolBusy);
  return (
    <Steps className="pl-2" defaultOpen={false}>
      <StepsTrigger leftIcon={<Hammer className="size-4" />}>
        {busy ? (
          <TextShimmer>{`Tool run: ${label}`}</TextShimmer>
        ) : (
          `Tool run: ${label}`
        )}
      </StepsTrigger>
      <StepsContent bar={<StepsBar className="mr-2 ml-1.5" />}>
        <div className="space-y-1">
          {tools.map((t, index) => (
            <StepsItem key={`${messageId}:tool:${index.toString()}`}>
              {toolStepLine(t)}
            </StepsItem>
          ))}
        </div>
      </StepsContent>
    </Steps>
  );
}

export function ReasoningBlock({
  messageId,
  thoughts,
}: {
  messageId: string;
  thoughts: string[];
}) {
  if (thoughts.length === 0) {
    return null;
  }
  return (
    <ChainOfThought className="pl-2">
      <ChainOfThoughtStep defaultOpen={false}>
        <ChainOfThoughtTrigger>Reasoning</ChainOfThoughtTrigger>
        <ChainOfThoughtContent>
          {thoughts.map((t, index) => (
            <ChainOfThoughtItem
              key={`${messageId}:thought:${index.toString()}`}
            >
              {t}
            </ChainOfThoughtItem>
          ))}
        </ChainOfThoughtContent>
      </ChainOfThoughtStep>
    </ChainOfThought>
  );
}

export function ChatMessage({ message }: { message: UIMessage }) {
  const text = getMessageText(message);
  if (message.role === "user") {
    if (!text) {
      return null;
    }
    return (
      <div className="flex justify-end">
        <Message className="flex-row-reverse">
          <div className="flex min-w-0 flex-col gap-2">
            <MessageContent className="bg-secondary" markdown={false}>
              {text}
            </MessageContent>
          </div>
        </Message>
      </div>
    );
  }

  const extras = getAssistantExtras(message.parts ?? []);
  if (!(text || extras.has)) {
    return null;
  }
  return (
    <div className="flex">
      <Message>
        <div className="flex min-w-0 flex-col gap-2">
          <SourcesRow messageId={message.id} sources={extras.sources} />
          <StepsBlock messageId={message.id} tools={extras.tools} />
          <ReasoningBlock messageId={message.id} thoughts={extras.thoughts} />
          {text ? <MessageContent markdown>{text}</MessageContent> : null}
        </div>
      </Message>
    </div>
  );
}
