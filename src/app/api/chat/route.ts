import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  generateText,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getSidebarData } from "@/actions/sites";
import { db } from "@/db/drizzle";
import {
  chatMessages,
  chatThreads,
  session as sessionTable,
} from "@/db/schema";
import { assistantTools } from "@/lib/ai/tools";
import { auth } from "@/lib/auth";
import { genericActionError, SignalError } from "@/lib/errors";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { threadId, messages }: { threadId?: string; messages: UIMessage[] } =
      await req.json();

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

    const [storedSession] = await db
      .select({ activeDomain: sessionTable.activeDomain })
      .from(sessionTable)
      .where(eq(sessionTable.id, session.session.id))
      .limit(1);

    const activeDomain = storedSession?.activeDomain ?? null;
    if (!activeDomain) {
      const error = SignalError.Site.NoActiveDomain();
      return Response.json(
        { success: false, error: { code: error.code, message: error.message } },
        { status: 400 }
      );
    }

    const [thread] = await db
      .select({
        id: chatThreads.id,
        title: chatThreads.title,
        domain: chatThreads.domain,
      })
      .from(chatThreads)
      .where(
        and(
          eq(chatThreads.id, threadId),
          eq(chatThreads.userId, session.user.id)
        )
      )
      .limit(1);

    if (!thread || thread.domain !== activeDomain) {
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
      messages: convertToModelMessages(messages),
      tools: assistantTools,
      stopWhen: stepCountIs(10),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onFinish: async ({ messages: finishedMessages }) => {
        try {
          const values = finishedMessages.map((m, seq) => ({
            threadId,
            messageId: m.id,
            seq,
            message: m,
          }));

          await db
            .insert(chatMessages)
            .values(values)
            .onConflictDoNothing({
              target: [chatMessages.threadId, chatMessages.messageId],
            });

          await db
            .update(chatThreads)
            .set({ updatedAt: new Date() })
            .where(eq(chatThreads.id, threadId));

          if (!thread.title) {
            const firstUser = finishedMessages.find((m) => m.role === "user");
            const userText =
              firstUser?.parts
                .filter((p) => p.type === "text")
                .map((p) => p.text)
                .join("")
                .trim() ?? "";

            if (userText) {
              const { text } = await generateText({
                model: openai("gpt-4o-mini"),
                system:
                  "Generate a very short title for this conversation. Return only the title.",
                prompt: userText.slice(0, 400),
                temperature: 0.5,
              });

              const title = text
                .trim()
                .replace(/^"|"$/g, "")
                .replace(/^'|'$/g, "")
                .slice(0, 80);

              if (title) {
                await db
                  .update(chatThreads)
                  .set({ title })
                  .where(eq(chatThreads.id, threadId));
              }
            }
          }
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
