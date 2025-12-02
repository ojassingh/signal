"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL as string,
      to,
      subject: "Anything I can help with?",
      html: `
        <p>Hey ${name} :)</p>
        <p>Just wanted to say thank you for signing up to Signal!</p>
        <p>I'm curious--how did you hear about us? Also are you just looking around or do you have a specific use case I can help you with?</p>
        <p>Anything you need I'm here to help, I read every single email!</p>
        <p>Ojas</p>
        <p>Founder, Signal</p>
      `,
    });
  } catch (error) {
    console.error("Failed to send welcome email:", error);
  }
}
