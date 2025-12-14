import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getSidebarData } from "@/actions/sites";
import { db } from "@/db/drizzle";
import { chatThreads } from "@/db/schema";
import { assistantTools } from "@/lib/ai/tools";
import { auth } from "@/lib/auth";
import { genericActionError, SignalError } from "@/lib/errors";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      threadId,
      messages: inputMessages,
    }: { threadId?: string; messages: UIMessage[] } = await req.json();

    if (!threadId) {
      const error = SignalError.Chat.ThreadIdRequired();
      return Response.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      const error = SignalError.Auth.Unauthorized();
      return Response.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 401 }
      );
    }

    const activeDomain = session.session.activeDomain;
    if (!activeDomain) {
      const error = SignalError.Site.NoActiveDomain();
      return Response.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 400 }
      );
    }

    const [thread] = await db
      .select({ id: chatThreads.id })
      .from(chatThreads)
      .where(
        and(
          eq(chatThreads.id, threadId),
          eq(chatThreads.userId, session.user.id),
          eq(chatThreads.domain, activeDomain)
        )
      )
      .limit(1);
    if (!thread) {
      const error = SignalError.Chat.ThreadNotFound();
      return Response.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 404 }
      );
    }

    const sidebar = await getSidebarData();
    const userName = sidebar.success ? sidebar.data.user.name : null;
    const sidebarDomain = sidebar.success ? sidebar.data.activeDomain : null;
    const context = [
      userName?.trim() ? `The user's name is ${userName.trim()}.` : "",
      sidebarDomain?.trim()
        ? `The active site domain is ${sidebarDomain.trim()}.`
        : "The user has no active site domain selected yet.",
    ]
      .filter(Boolean)
      .join(" ");

    const system = [
      "You are Signal, a concise and proactive assistant for analyzing a user's website traffic and answering questions.",
      "You have three tools: getSiteTraffic for analytics, webAnswersFromExa for fast web-grounded sources, and webResearchFromExa for deeper research.",
      "When a question depends on current traffic data, call getSiteTraffic. When it depends on the web, call webAnswersFromExa. Use webResearchFromExa when the user asks for deep research or comprehensive synthesis.",
      "When using web results, cite sources as Title + URL.",
      "If the user has no site connected or no active domain, ask them to add/select a site in the sidebar before analyzing traffic.",
      context,
    ]
      .filter(Boolean)
      .join("\n");

    const result = streamText({
      model: openai(process.env.OPENAI_MODEL ?? "gpt-5.2"),
      system,
      messages: convertToModelMessages(inputMessages),
      tools: assistantTools,
      stopWhen: stepCountIs(10),
    });

    result.consumeStream();

    return result.toUIMessageStreamResponse({
      originalMessages: inputMessages,
      onFinish: async ({ messages: finishedMessages }) => {
        try {
          await db
            .update(chatThreads)
            .set({ messages: finishedMessages, updatedAt: new Date() })
            .where(eq(chatThreads.id, threadId));
        } catch (error) {
          console.error(SignalError.Chat.PersistFailed(), error);
        }
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { success: false, error: genericActionError },
      { status: 500 }
    );
  }
}
