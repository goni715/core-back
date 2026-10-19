import { sendMailUnified } from "./emailTransporter";
import { generateForgotEmail } from "./emailTemplates";

/**
 * Sends a high-deliverability password reset email with an OTP code.
 *
 * @param EmailTo - Target recipient email address
 * @param otp - 6-digit one-time password
 */
const sendForgotEmail = async (EmailTo: string, otp: string) => {
  const { subject, html, text } = generateForgotEmail({
    email: EmailTo,
    otp,
  });

  return await sendMailUnified({
    to: EmailTo,
    subject,
    text,
    html,
  });
};

export default sendForgotEmail;
