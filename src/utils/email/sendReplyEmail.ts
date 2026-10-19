import { sendMailUnified } from "./emailTransporter";
import { generateReplyEmail } from "./emailTemplates";

/**
 * Sends a customer support reply email to the inquirer.
 *
 * @param email - Target recipient email address
 * @param replyMessage - Customer support reply text
 */
const sendReplyEmail = async (email: string, replyMessage: string) => {
  const { subject, html, text } = generateReplyEmail({
    email,
    replyMessage,
  });

  return await sendMailUnified({
    to: email,
    subject,
    text,
    html,
  });
};

export default sendReplyEmail;
