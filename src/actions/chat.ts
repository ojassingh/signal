"use server";

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { chatThreads } from "@/db/schema";
import { authAction } from "@/lib/actions";
import { SignalError } from "@/lib/errors";

export async function createThreadTitle(prompt: string) {
  const { text } = await generateText({
    model: openai("gpt-5.1-nano"),
    system:
      "Write a short thread title (3-5 words) based on the user's first message. Return only the title text. No quotes or other formatting.",
    prompt,
    temperature: 0.5,
  });
  const title = text.slice(0, 80);
  return title;
}

export const createChatThread = authAction(
  async ({ session }, firstMessage?: string) => {
    const domain = session.session.activeDomain;
    if (!domain) {
      throw SignalError.Site.NoActiveDomain();
    }

    const [thread] = await db
      .insert(chatThreads)
      .values({ userId: session.user.id, domain })
      .returning({ id: chatThreads.id });
    if (!thread) {
      throw SignalError.Chat.ThreadNotFound();
    }

    if (firstMessage?.trim()) {
      const title = await createThreadTitle(firstMessage);
      if (title) {
        await db
          .update(chatThreads)
          .set({ title, updatedAt: new Date() })
          .where(eq(chatThreads.id, thread.id));
      }
    }
    return { threadId: thread.id };
  }
);

export const listRecentChatThreads = authAction(
  async ({ session }, domain: string) => {
    const rows = await db
      .select({
        threadId: chatThreads.id,
        title: chatThreads.title,
        updatedAt: chatThreads.updatedAt,
      })
      .from(chatThreads)
      .where(
        and(
          eq(chatThreads.userId, session.user.id),
          eq(chatThreads.domain, domain)
        )
      )
      .orderBy(desc(chatThreads.updatedAt))
      .limit(5);

    return rows;
  }
);

export const getChatThread = authAction(
  async ({ session }, threadId: string) => {
    if (!threadId?.trim()) {
      throw SignalError.Chat.ThreadIdRequired();
    }
    const [thread] = await db
      .select({
        threadId: chatThreads.id,
        title: chatThreads.title,
        domain: chatThreads.domain,
        messages: chatThreads.messages,
      })
      .from(chatThreads)
      .where(
        and(
          eq(chatThreads.id, threadId),
          eq(chatThreads.userId, session.user.id)
        )
      )
      .limit(1);

    if (!thread) {
      throw SignalError.Chat.ThreadNotFound();
    }

    return {
      threadId: thread.threadId,
      title: thread.title,
      domain: thread.domain,
      messages: thread.messages ?? [],
    };
  }
);
