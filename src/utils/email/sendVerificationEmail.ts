import { sendMailUnified } from "./emailTransporter";
import { generateVerificationEmail } from "./emailTemplates";

/**
 * Sends a high-deliverability account verification email with an OTP code.
 *
 * @param email - Target recipient email address
 * @param otp - 6-digit one-time password
 */
const sendVerificationEmail = async (email: string, otp: string) => {
  const { subject, html, text } = generateVerificationEmail({ email, otp });

  return await sendMailUnified({
    to: email,
    subject,
    text,
    html,
  });
};

export default sendVerificationEmail;
