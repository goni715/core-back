/**
 * 3S Medi Care - Modern, High-Deliverability Email Templates
 * Designed for anti-spam compliance, WCAG contrast standards, and multi-client compatibility.
 */

interface IOtpTemplateParams {
  email: string;
  otp: string;
}

interface IReplyTemplateParams {
  email: string;
  replyMessage: string;
}

/**
 * Trailing zero-width characters to prevent email clients from showing
 * unwanted trailing HTML or footer text in the inbox preview snippet.
 */
const PREHEADER_FILLER =
  "&#847; &zwnj; &nbsp; ".repeat(30);

/**
 * Renders OTP digits as individual, high-contrast, modern visual tiles.
 */
const renderOtpTiles = (
  otp: string,
  textColor: string,
  bgColor: string,
  borderColor: string
): string => {
  const digits = otp.toString().trim().split("");
  const tilesHtml = digits
    .map(
      (digit) => `
      <td align="center" valign="middle" style="padding: 0 4px;">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation">
          <tr>
            <td align="center" valign="middle"
                style="width: 44px; height: 54px; background-color: ${bgColor}; border: 1.5px solid ${borderColor}; border-radius: 8px; font-family: 'SFMono-Regular', Consolas, 'Courier New', Courier, monospace; font-size: 28px; font-weight: 700; color: ${textColor}; text-align: center; mso-line-height-rule: exactly; line-height: 54px;">
              ${digit}
            </td>
          </tr>
        </table>
      </td>
    `
    )
    .join("");

  return `
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin: 0 auto;">
      <tr>
        ${tilesHtml}
      </tr>
    </table>
  `;
};

/**
 * Base email layout wrapper providing responsive viewport, MSO Outlook compatibility,
 * consistent header, and spam-compliant footer.
 */
const renderBaseLayout = ({
  preheader,
  headerBadge,
  headerBadgeBg,
  headerBadgeColor,
  accentGradient,
  accentColorFallback,
  title,
  subtitle,
  bodyContent,
  recipientEmail,
}: {
  preheader: string;
  headerBadge: string;
  headerBadgeBg: string;
  headerBadgeColor: string;
  accentGradient: string;
  accentColorFallback: string;
  title: string;
  subtitle: string;
  bodyContent: string;
  recipientEmail: string;
}): string => {
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title} - 3S Medi Care</title>
  <style type="text/css">
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #0f172a;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
        border-left: 0 !important;
        border-right: 0 !important;
      }
      .email-content {
        padding: 24px 20px !important;
      }
      .email-header {
        padding: 28px 20px 20px !important;
      }
      .email-footer {
        padding: 24px 20px !important;
      }
    }
  </style>
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a, li, blockquote { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">

  <!-- Preheader text (hidden preview in mail clients) -->
  <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${preheader} ${PREHEADER_FILLER}
  </div>

  <!-- Outer background wrapper -->
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f1f5f9; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 36px 12px 48px;">

        <!-- Main Card Container -->
        <!--[if (gte mso 9)|(IE)]>
        <table align="center" border="0" cellspacing="0" cellpadding="0" width="560">
        <tr>
        <td align="center" valign="top" width="560">
        <![endif]-->
        <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation"
               style="max-width: 560px; background-color: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);">

          <!-- Top Gradient Accent Bar -->
          <tr>
            <td height="5" style="background-color: ${accentColorFallback}; background-image: ${accentGradient}; font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td class="email-header" align="center" style="padding: 36px 40px 24px; background-color: #ffffff;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <!-- Medical Emblem / Badge -->
                  <td align="center" style="padding-bottom: 14px;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td align="center" valign="middle"
                            style="width: 48px; height: 48px; border-radius: 12px; background-color: #0284c7; color: #ffffff; font-size: 24px; font-weight: 700; font-family: Arial, sans-serif; line-height: 48px; box-shadow: 0 4px 10px rgba(2, 132, 199, 0.25);">
                          &#43;
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 21px; font-weight: 800; color: #0f172a; letter-spacing: 0.8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      3S MEDI CARE
                    </p>
                    <p style="margin: 4px 0 0; font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 1.5px; text-transform: uppercase;">
                      Healthcare &amp; Patient Services
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 14px;">
                    <!-- Category Badge -->
                    <span style="display: inline-block; padding: 4px 12px; background-color: ${headerBadgeBg}; color: ${headerBadgeColor}; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; border-radius: 20px;">
                      ${headerBadge}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td height="1" style="background-color: #f1f5f9; font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td class="email-content" style="padding: 32px 40px 36px; background-color: #ffffff;">

              <!-- Title & Greeting -->
              <h1 style="margin: 0 0 10px; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.35;">
                ${title}
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; color: #334155; line-height: 1.6;">
                ${subtitle}
              </p>

              <!-- Dynamic Body Injected -->
              ${bodyContent}

            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td class="email-footer" style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 28px 40px; text-align: center;">

              <p style="margin: 0 0 8px; font-size: 12px; font-weight: 500; color: #475569; line-height: 1.5;">
                This automated message was sent to <strong style="color: #0f172a;">${recipientEmail}</strong>
              </p>

              <p style="margin: 0 0 14px; font-size: 12px; color: #64748b; line-height: 1.5;">
                Need help or have questions? Simply reply directly to this email or visit our patient portal.
              </p>

              <!-- Security disclaimer -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 14px;">
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4; max-width: 440px;">
                      &#128274; 3S Medi Care will never ask you for your account password or one-time verification code via phone, chat, or third-party links.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                &copy; ${currentYear} 3S Medi Care. All rights reserved.
              </p>

            </td>
          </tr>

        </table>
        <!--[if (gte mso 9)|(IE)]>
        </td>
        </tr>
        </table>
        <![endif]-->

      </td>
    </tr>
  </table>

</body>
</html>`;
};

/**
 * Generates Email Verification Template (HTML + Text + Subject)
 */
export const generateVerificationEmail = ({ email, otp }: IOtpTemplateParams) => {
  const subject = `Your 3S Medi Care verification code is ${otp}`;
  const preheader = `Your 6-digit verification code is ${otp}. Complete your 3S Medi Care account verification. This code expires in 10 minutes.`;

  const bodyContent = `
    <!-- Verification Code Card -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 24px 0 28px;">
      <tr>
        <td align="center" style="background-color: #f0f9ff; border: 1.5px solid #bae6fd; border-radius: 12px; padding: 24px 16px;">
          <p style="margin: 0 0 14px; font-size: 11px; font-weight: 700; color: #0284c7; letter-spacing: 1.5px; text-transform: uppercase;">
            One-Time Verification Code
          </p>

          <!-- OTP Digit Tiles -->
          ${renderOtpTiles(otp, "#0369a1", "#ffffff", "#7dd3fc")}

          <p style="margin: 14px 0 0; font-size: 12px; color: #64748b;">
            Code: <strong style="color: #0369a1; font-family: monospace; font-size: 14px; letter-spacing: 2px;">${otp}</strong>
          </p>
        </td>
      </tr>
    </table>

    <!-- Expiry & Security Notes -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #fefce8; border-left: 4px solid #eab308; border-radius: 0 8px 8px 0; padding: 14px 16px;">
          <p style="margin: 0; font-size: 13px; font-weight: 500; color: #854d0e; line-height: 1.5;">
            <strong>Expires in 10 minutes:</strong> Please enter this code promptly to activate your account.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
      If you did not create a 3S Medi Care account, you can safely disregard this email. Your email address will not be registered without completing this verification step.
    </p>
  `;

  const html = renderBaseLayout({
    preheader,
    headerBadge: "Account Verification",
    headerBadgeBg: "#e0f2fe",
    headerBadgeColor: "#0369a1",
    accentGradient: "linear-gradient(90deg, #0284c7 0%, #2563eb 100%)",
    accentColorFallback: "#0284c7",
    title: "Verify Your Email Address",
    subtitle:
      "Thank you for joining 3S Medi Care. Please use the following 6-digit verification code to complete your registration and secure your profile:",
    bodyContent,
    recipientEmail: email,
  });

  const text = `
3S MEDI CARE - ACCOUNT VERIFICATION
--------------------------------------------------

Hello,

Thank you for registering with 3S Medi Care. To complete your account verification, please enter the following code:

VERIFICATION CODE: ${otp}

This code expires in 10 minutes.

For your security, never share this code with anyone. If you did not create an account with 3S Medi Care, you can safely ignore this email.

--------------------------------------------------
This email was sent to ${email}
© ${new Date().getFullYear()} 3S Medi Care. All rights reserved.
  `.trim();

  return { subject, html, text };
};

/**
 * Generates Password Reset Email Template (HTML + Text + Subject)
 */
export const generateForgotEmail = ({ email, otp }: IOtpTemplateParams) => {
  const subject = `Your 3S Medi Care password reset code is ${otp}`;
  const preheader = `Your password reset code is ${otp}. Use this code within 10 minutes to reset your 3S Medi Care password.`;

  const bodyContent = `
    <!-- Reset Code Card -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 24px 0 28px;">
      <tr>
        <td align="center" style="background-color: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 12px; padding: 24px 16px;">
          <p style="margin: 0 0 14px; font-size: 11px; font-weight: 700; color: #ea580c; letter-spacing: 1.5px; text-transform: uppercase;">
            Password Reset Code
          </p>

          <!-- OTP Digit Tiles -->
          ${renderOtpTiles(otp, "#9a3412", "#ffffff", "#fdba74")}

          <p style="margin: 14px 0 0; font-size: 12px; color: #64748b;">
            Code: <strong style="color: #9a3412; font-family: monospace; font-size: 14px; letter-spacing: 2px;">${otp}</strong>
          </p>
        </td>
      </tr>
    </table>

    <!-- Expiry & Security Notes -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #fefce8; border-left: 4px solid #ea580c; border-radius: 0 8px 8px 0; padding: 14px 16px;">
          <p style="margin: 0; font-size: 13px; font-weight: 500; color: #9a3412; line-height: 1.5;">
            <strong>Valid for 10 minutes:</strong> Never share this code with anyone, including support agents.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.6;">
      If you did not request a password reset, your account is still completely safe and no action is required. Someone may have typed your email address by mistake.
    </p>
  `;

  const html = renderBaseLayout({
    preheader,
    headerBadge: "Password Reset",
    headerBadgeBg: "#ffedd5",
    headerBadgeColor: "#c2410c",
    accentGradient: "linear-gradient(90deg, #ea580c 0%, #dc2626 100%)",
    accentColorFallback: "#ea580c",
    title: "Reset Your Password",
    subtitle:
      "We received a request to reset the password for your 3S Medi Care account. Use the authorization code below to establish a new password:",
    bodyContent,
    recipientEmail: email,
  });

  const text = `
3S MEDI CARE - PASSWORD RESET
--------------------------------------------------

Hello,

We received a request to reset the password for your 3S Medi Care account. Use the following code to proceed:

RESET CODE: ${otp}

This code expires in 10 minutes.

If you did not request a password reset, you can safely disregard this email. Your password will remain unchanged and your account is secure.

--------------------------------------------------
This email was sent to ${email}
© ${new Date().getFullYear()} 3S Medi Care. All rights reserved.
  `.trim();

  return { subject, html, text };
};

/**
 * Generates Customer Support Reply Email Template (HTML + Text + Subject)
 */
export const generateReplyEmail = ({
  email,
  replyMessage,
}: IReplyTemplateParams) => {
  const subject = "Response to Your Inquiry - 3S Medi Care Support";
  const preheader =
    "Our support team has reviewed your inquiry and replied. View your message details inside.";

  const bodyContent = `
    <!-- Support Message Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 24px 0 28px;">
      <tr>
        <td style="background-color: #f0fdf4; border: 1.5px solid #bbf7d0; border-left: 4px solid #10b981; border-radius: 0 10px 10px 0; padding: 20px 22px;">
          <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #047857; letter-spacing: 1.2px; text-transform: uppercase;">
            Support Team Message
          </p>
          <div style="font-size: 15px; color: #0f172a; line-height: 1.65; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
${replyMessage}
          </div>
        </td>
      </tr>
    </table>

    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
      <tr>
        <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px;">
          <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">
            &#128172; <strong>Have further questions?</strong> You can reply directly to this email to continue your conversation with our support team.
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = renderBaseLayout({
    preheader,
    headerBadge: "Support Response",
    headerBadgeBg: "#dcfce7",
    headerBadgeColor: "#15803d",
    accentGradient: "linear-gradient(90deg, #10b981 0%, #0d9488 100%)",
    accentColorFallback: "#10b981",
    title: "Response to Your Inquiry",
    subtitle:
      "Thank you for contacting 3S Medi Care Support. Our team has reviewed your message and prepared the following response:",
    bodyContent,
    recipientEmail: email,
  });

  const text = `
3S MEDI CARE - SUPPORT RESPONSE
--------------------------------------------------

Hello,

Thank you for reaching out to 3S Medi Care Support. Our team has reviewed your inquiry and replied:

--------------------------------------------------
${replyMessage}
--------------------------------------------------

If you have further questions, simply reply directly to this email.

--------------------------------------------------
This email was sent to ${email}
© ${new Date().getFullYear()} 3S Medi Care. All rights reserved.
  `.trim();

  return { subject, html, text };
};
