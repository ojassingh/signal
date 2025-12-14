import { openai } from "@ai-sdk/openai";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { and, eq } from "drizzle-orm";
import type { Elysia } from "elysia";
import { db } from "@/db/drizzle";
import { chatThreads } from "@/db/schema";
import { createAssistantTools } from "@/lib/ai/tools";
import { auth } from "@/lib/auth";
import { genericActionError, SignalError } from "@/lib/errors";

export function registerChatRoutes(app: Elysia) {
  return app.post("/api/chat", async ({ request }) => {
    try {
      const {
        threadId,
        messages: inputMessages,
      }: { threadId?: string; messages: UIMessage[] } = await request.json();

      if (!threadId) {
        const error = SignalError.Chat.ThreadIdRequired();
        return Response.json(
          {
            success: false,
            error: { code: error.code, message: error.message },
          },
          { status: 400 }
        );
      }

      const start = Date.now();
      const session = await auth.api.getSession({ headers: request.headers });
      const elapsed = Date.now() - start;
      console.log("[API Chat Route] Time taken to get session:", elapsed, "ms");

      if (!session) {
        const error = SignalError.Auth.Unauthorized();
        return Response.json(
          {
            success: false,
            error: { code: error.code, message: error.message },
          },
          { status: 401 }
        );
      }

      const activeDomain = session.session.activeDomain;
      if (!activeDomain) {
        const error = SignalError.Site.NoActiveDomain();
        return Response.json(
          {
            success: false,
            error: { code: error.code, message: error.message },
          },
          { status: 400 }
        );
      }

      const context = [
        session.user.name?.trim()
          ? `The user's name is ${session.user.name.trim()}.`
          : "",
        activeDomain?.trim()
          ? `The active site domain is ${activeDomain.trim()}.`
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
        model: openai("gpt-5-mini-2025-08-07"),
        system,
        messages: convertToModelMessages(inputMessages),
        tools: createAssistantTools({ session }),
        stopWhen: stepCountIs(10),
      });

      result.consumeStream();

      return result.toUIMessageStreamResponse({
        originalMessages: inputMessages,
        onFinish: async ({ messages: finishedMessages }) => {
          try {
            const startSave = Date.now();

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
              throw SignalError.Chat.ThreadNotFound();
            }

            await db
              .update(chatThreads)
              .set({ messages: finishedMessages, updatedAt: new Date() })
              .where(eq(chatThreads.id, threadId));

            const elapsedSave = Date.now() - startSave;
            console.log(
              "[API Chat Route] Time taken to update thread messages:",
              elapsedSave,
              "ms"
            );
          } catch (error) {
            console.error(error);
            if (error instanceof SignalError) {
              throw error;
            }
            throw genericActionError;
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
  });
}
