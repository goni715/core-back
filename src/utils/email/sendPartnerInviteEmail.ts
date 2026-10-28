import { sendMailUnified } from "./emailTransporter";

interface ISendPartnerInviteParams {
  to: string;
  partnerName: string;
  partnerId: string;
  inviteLink: string;
  channelPartnerName?: string;
}

/**
 * Sends an invitation email to a newly invited Referral Partner
 */
const sendPartnerInviteEmail = async ({
  to,
  partnerName,
  partnerId,
  inviteLink,
  channelPartnerName = "3S Medi Care Int",
}: ISendPartnerInviteParams) => {
  const subject = `You're invited to join ${channelPartnerName} as a Referral Partner`;
  
  const text = `Hello ${partnerName},

You have been invited by ${channelPartnerName} to become a Referral Partner (Partner ID: ${partnerId}).

Join our healthcare network and start managing patient referrals and tracking your earnings.

Accept your invitation here:
${inviteLink}

Best regards,
${channelPartnerName} Team`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Partner Invitation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7fb; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { margin-bottom: 24px; }
    .badge { display: inline-block; background-color: #e0f2fe; color: #0284c7; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.5px; }
    h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin: 12px 0 8px 0; }
    p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0; }
    .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; }
    .info-item { font-size: 13px; color: #64748b; margin-bottom: 6px; }
    .info-val { font-weight: 600; color: #0f172a; }
    .btn { display: inline-block; background-color: #ea580c; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 10px; margin-top: 12px; text-align: center; }
    .footer { margin-top: 32px; pt-4; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">Referral Partner Invitation</span>
      <h1>Welcome to 3S Medi Care Network</h1>
      <p>Hello <strong>${partnerName}</strong>,</p>
      <p>You have been personally invited by <strong>${channelPartnerName}</strong> to join our channel partner network as an official Referral Partner.</p>
    </div>

    <div class="info-box">
      <div class="info-item">Your Referral Partner ID: <span class="info-val">${partnerId}</span></div>
      <div class="info-item">Channel Partner: <span class="info-val">${channelPartnerName}</span></div>
      <div class="info-item">Role: <span class="info-val">Referral Partner</span></div>
    </div>

    <p>As a Referral Partner, you can submit patient cases, monitor ongoing treatments in top international hospitals, and earn attractive commissions for every completed case.</p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${inviteLink}" class="btn" target="_blank" style="color: #ffffff;">Accept Invitation & Get Started</a>
    </div>

    <p style="font-size: 12px; color: #64748b; word-break: break-all;">
      Or paste this link in your browser: <br/>
      <a href="${inviteLink}" style="color: #0284c7;">${inviteLink}</a>
    </p>

    <div class="footer">
      &copy; ${new Date().getFullYear()} 3S Medi Care Int. All rights reserved.
    </div>
  </div>
</body>
</html>
`;

  try {
    return await sendMailUnified({
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("Failed to send partner invite email:", error);
    return null;
  }
};

export default sendPartnerInviteEmail;
