"use server";

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { chatThreads } from "@/db/schema";
import { authAction } from "@/lib/actions";
import { SignalError } from "@/lib/errors";
import type { ChatThreadListItem } from "@/lib/types";

export async function createAndSaveThreadTitle(
  threadId: string,
  prompt: string
) {
  const { text } = await generateText({
    model: openai("gpt-5-nano-2025-08-07"),
    prompt: `You are a skilled assistant for a product called Signal which is an AI growth engine for SEO and AI search. Your task is to generate a clear, concise, and compelling thread title that summarizes the user's first message. Use 3-5 words, focus on the core topic, and avoid unnecessary words, punctuation, or formatting (such as quotes). Respond with only the title text.
    Here's the user's first message: ${prompt}`,
  });
  const title = text.slice(0, 80);
  await db
    .update(chatThreads)
    .set({ title, updatedAt: new Date() })
    .where(eq(chatThreads.id, threadId));
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
      createAndSaveThreadTitle(thread.id, firstMessage);
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

export const getUserChatThreads = authAction(
  async ({ session }): Promise<ChatThreadListItem[]> =>
    db
      .select({
        threadId: chatThreads.id,
        title: chatThreads.title,
      })
      .from(chatThreads)
      .where(eq(chatThreads.userId, session.user.id))
      .orderBy(desc(chatThreads.createdAt))
      .limit(5)
);
