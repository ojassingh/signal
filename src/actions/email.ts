"use server";

import { head, split } from "lodash";
import { Resend } from "resend";
import { authAction } from "@/lib/actions";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendWelcomeEmail = authAction(
  async (
    _,
    { email, name }: { email: string; name: string }
  ): Promise<void> => {
    const firstName = head(split(name, " ")) || "there";
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL as string,
      to: email,
      subject: "Anything I can help with?",
      html: `
        <p>Hey ${firstName} :)</p>
        <p>Just wanted to say thank you for signing up to Signal!</p>
        <p>I'm curious--how did you hear about us? Also are you just looking around or do you have a specific use case I can help you with?</p>
        <p>Anything you need I'm here to help, I read every single email!</p>
        <p>Ojas</p>
        <p>Founder, Signal</p>
      `,
    });
  }
);
