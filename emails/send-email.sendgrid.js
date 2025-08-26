import sgMail from "@sendgrid/mail";

// Set your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send mail
export const sendEmailUsingSendGrid = async ({ to, sub, html }) => {
  try {
    const msg = {
      to: to, // 👈 person who will receive email
      from: "sharmadivanshu008@gmail.com", // 👈 must be the verified sender you created
      subject: sub,
      html: html,
    };

    const response = await sgMail.send(msg);
    console.log("Email sent successfully ✅", response);
  } catch (error) {
    console.error("Error sending email ❌", error);
  }
};
