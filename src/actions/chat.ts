"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { chatThreads } from "@/db/schema";
import { authAction } from "@/lib/actions";
import { SignalError } from "@/lib/errors";

export const createChatThread = authAction(
  async ({ session }, domain: string) => {
    if (!domain?.trim()) {
      throw SignalError.Site.NoActiveDomain();
    }
    const [thread] = await db
      .insert(chatThreads)
      .values({ userId: session.user.id, domain })
      .returning({ id: chatThreads.id });
    if (!thread) {
      throw SignalError.Chat.CreateThreadFailed();
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
