import nodemailer from "nodemailer";
import { testAccount, transporter } from "./config.nodemailer.js";

export const sendEmail = async ({ to, sub, html }) => {
  const info = await transporter.sendMail({
    from: `${testAccount.user}`,
    to: to,
    subject: sub,
    html: html, // HTML body
  });
  const testEmailUrl = nodemailer.getTestMessageUrl(info);
  console.log("verify email URL: ", testEmailUrl);
};
