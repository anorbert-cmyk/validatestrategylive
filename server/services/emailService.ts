
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Send email via Resend API
 */
export async function sendEmail(to: string, template: EmailTemplate): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "hello@validatestrategy.com";

  if (!apiKey) {
    console.error("[EmailService] RESEND_API_KEY not configured");
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `ValidateStrategy <${fromEmail}>`,
        to: [to],
        subject: template.subject,
        html: template.html,
        text: template.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[EmailService] Failed to send email to ${to}:`, error);
      return false;
    }

    console.log(`[EmailService] Successfully sent email to ${to}: ${template.subject}`);
    return true;
  } catch (error) {
    console.error("[EmailService] Network error sending email:", error);
    return false;
  }
}

// Helper
const getResendApiKey = () => process.env.RESEND_API_KEY;

export const isEmailConfigured = () => !!getResendApiKey();

// ===========================================
// VALIDATE STRATEGY REPORT EMAIL
// ===========================================

export interface ValidateStrategyEmailParams {
  to: string;
  userName: string;
  magicLinkUrl: string;
  transactionId: string;
  amount: string;
  currency: string;
  tier: string;
}

/**
 * Send the delivery email with analysis link
 */
export async function sendValidateStrategyEmail(params: ValidateStrategyEmailParams): Promise<boolean> {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    console.error('[Email] RESEND_API_KEY not configured');
    return false;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@validatestrategy.com';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `ValidateStrategy <${fromEmail}>`,
        to: [params.to],
        subject: `Your ${params.tier.toUpperCase()} Strategic Analysis is Ready`,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Analysis is Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f1a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.6; color: #e0e0e0;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #0f0f1a; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" style="max-width: 600px; width: 100%;">
                    <tr>
                        <td>
                            <!-- MAIN CARD -->
                            <div style="background: linear-gradient(145deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; border: 1px solid rgba(139, 92, 246, 0.2); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4); overflow: hidden;">
                                
                                <!-- HEADER -->
                                <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%); padding: 30px; text-align: center; border-bottom: 1px solid rgba(139, 92, 246, 0.2);">
                                    <div style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                        ⚡ ValidateStrategy
                                    </div>
                                    <div style="font-size: 12px; color: #8b5cf6; text-transform: uppercase; letter-spacing: 2px; margin-top: 5px;">
                                        Analysis Complete
                                    </div>
                                </div>

                                <!-- CONTENT -->
                                <div style="padding: 40px 30px; text-align: center;">
                                    
                                    <!-- ICON -->
                                    <div style="margin-bottom: 25px;">
                                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center;">
                                            <span style="font-size: 36px;">🚀</span>
                                        </div>
                                    </div>

                                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 15px; letter-spacing: -0.5px;">Ready for Launch</h1>
                                    <p style="margin: 0 0 30px; color: #a0a0b0; font-size: 16px;">
                                        Your <strong>${params.tier}</strong> analysis has been generated successfully. 
                                        The swarm has spoken.
                                    </p>

                                    <!-- BUTTON -->
                                    <div style="margin: 30px 0;">
                                        <a href="${params.magicLinkUrl}" target="_blank" style="background: linear-gradient(90deg, #8b5cf6 0%, #6366f1 100%); border-radius: 50px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: bold; line-height: 54px; text-align: center; text-decoration: none; width: 260px; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);">
                                            View Report →
                                        </a>
                                    </div>
                                    
                                    <div style="background: rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 15px; margin-top: 30px; text-align: left;">
                                        <div style="font-size: 12px; text-transform: uppercase; color: #6b6b80; letter-spacing: 1px; margin-bottom: 10px;">Transaction Details</div>
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                            <span style="color: #a0a0b0;">ID:</span>
                                            <span style="color: #ffffff; font-family: monospace;">${params.transactionId.substring(0, 18)}...</span>
                                        </div>
                                        <div style="display: flex; justify-content: space-between;">
                                            <span style="color: #a0a0b0;">Total:</span>
                                            <span style="color: #10b981; font-weight: bold;">$${params.amount}</span>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <!-- FOOTER -->
                            <div style="margin-top: 30px; text-align: center;">
                                <p style="color: #6b6b80; font-size: 12px;">
                                    © ValidateStrategy • AI-Powered Strategic Analysis<br>
                                </p>
                            </div>

                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
        text: `Your Analysis is Ready

Your ${params.tier} strategic analysis has been successfully generated.

View Report: ${params.magicLinkUrl}

Transaction ID: ${params.transactionId}
Total: $${params.amount}

© ValidateStrategy
`
      })
    });

    return response.ok;
  } catch (error) {
    console.error('[Email] Failed to send report email', error);
    return false;
  }
}

// ===========================================
// MAGIC LINK EMAIL
// ===========================================

/**
 * Send magic link for passwordless login
 */
export async function sendMagicLinkEmail(to: string, magicLinkUrl: string): Promise<boolean> {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    console.error('[Email] RESEND_API_KEY not configured');
    return false;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@validatestrategy.com';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `ValidateStrategy <${fromEmail}>`,
        to: [to],
        subject: '✨ Your Magic Link to ValidateStrategy',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Magic Link</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f1a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.6; color: #e0e0e0;">
    <p>Click below to sign in:</p>
    <a href="${magicLinkUrl}">Sign In Now</a>
</body>
</html>`,
        text: `Log in to ValidateStrategy: ${magicLinkUrl}`
      })
    });

    return response.ok;
  } catch (error) {
    console.error('[Email] Magic link email sending failed', error);
    return false;
  }
}

// ===========================================
// EMAIL VERIFICATION
// ===========================================

export interface VerificationEmailParams {
  to: string;
  verificationUrl: string;
}

/**
 * Send email verification link
 */
export async function sendVerificationEmail(params: VerificationEmailParams): Promise<boolean> {
  const apiKey = getResendApiKey();

  if (!apiKey) {
    console.error('[Email] RESEND_API_KEY not configured');
    return false;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@validatestrategy.com';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `ValidateStrategy <${fromEmail}>`,
        to: [params.to],
        subject: 'Verify your email to unlock Full Demo',
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f1a; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; font-size: 16px; line-height: 1.6; color: #e0e0e0;">
    <p>Please verifying your email to access the demo:</p>
    <a href="${params.verificationUrl}">Verify Now</a>
</body>
</html>`,
        text: `Verify Email: ${params.verificationUrl}`
      })
    });

    return response.ok;
  } catch (error) {
    console.error('[Email] Verification email sending failed', error);
    return false;
  }
}

export type { EmailTemplate };
