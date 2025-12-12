import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { getSidebarData } from "@/actions/sites";
import { assistantTools } from "@/lib/ai/tools";

export const maxDuration = 30;

function greetingContext(name?: string | null, activeDomain?: string | null) {
  const safeName = name?.trim() ? `The user's name is ${name.trim()}.` : "";
  const safeDomain = activeDomain?.trim()
    ? `The active site domain is ${activeDomain.trim()}.`
    : "The user has no active site domain selected yet.";
  return [safeName, safeDomain].filter(Boolean).join(" ");
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const sidebar = await getSidebarData();
  const userName = sidebar.success ? sidebar.data.user.name : null;
  const activeDomain = sidebar.success ? sidebar.data.activeDomain : null;

  const system = [
    "You are Signal, a concise and proactive assistant for analyzing a user's website traffic and answering questions.",
    "You have three tools: getSiteTraffic for analytics, webAnswersFromExa for fast web-grounded sources, and webResearchFromExa for deeper research.",
    "When a question depends on current traffic data, call getSiteTraffic. When it depends on the web, call webAnswersFromExa. Use webResearchFromExa when the user asks for deep research or comprehensive synthesis.",
    "When using web results, cite sources as Title + URL.",
    "If the user has no site connected or no active domain, ask them to add/select a site in the sidebar before analyzing traffic.",
    greetingContext(userName, activeDomain),
  ]
    .filter(Boolean)
    .join("\n");

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL ?? "gpt-5.2"),
    system,
    messages: convertToModelMessages(messages),
    tools: assistantTools,
    stopWhen: stepCountIs(10),
  });

  return result.toUIMessageStreamResponse();
}
