import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmailUsingResend = async ({ to, sub, html }) => {
  try {
    const data = await resend.emails.send({
      from: "onboarding@resend.dev", // better to replace with your verified domain
      to: to,
      subject: sub,
      html: html,
    });
    console.log("Email sent:", data);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};


