import nodemailer from "nodemailer";

export const testAccount = await nodemailer.createTestAccount();
export const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: testAccount.user,
    pass: testAccount.user,
  },
});
