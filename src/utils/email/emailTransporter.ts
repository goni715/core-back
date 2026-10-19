import nodemailer from "nodemailer";
import config from "../../config";

/**
 * Extracts and sanitizes the sender email address from configuration,
 * stripping surrounding angle brackets if present.
 */
export const getCleanSenderEmail = (): string => {
  const rawEmail = config.smtp.smtp_from || config.smtp.smtp_username || "";
  return rawEmail.replace(/[<>]/g, "").trim();
};

/**
 * Singleton Nodemailer Transporter
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: config.node_env === "production" ? 465 : 587,
  secure: config.node_env === "production",
  auth: {
    user: config.smtp.smtp_username,
    pass: config.smtp.smtp_password,
  },
  tls: {
    rejectUnauthorized: config.node_env === "production",
  },
});

export interface ISendMailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/**
 * Unified mail sender with RFC-compliant headers and spam-prevention settings
 */
export const sendMailUnified = async ({
  to,
  subject,
  text,
  html,
}: ISendMailOptions) => {
  const cleanEmail = getCleanSenderEmail();

  const mailOptions = {
    from: {
      name: "3S Medi Care",
      address: cleanEmail,
    },
    to,
    replyTo: cleanEmail,
    subject,
    text,
    html,
    headers: {
      "X-Entity-Ref-ID": `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      "Auto-Submitted": "auto-generated",
      "X-Auto-Response-Suppress": "OOF, AutoReply",
    },
  };

  return await transporter.sendMail(mailOptions);
};

export default transporter;
