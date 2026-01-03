/**
 * Error Notification System
 * 
 * Handles user-facing notifications for analysis errors and recovery status.
 * Provides multi-channel notifications (email, in-app, webhook) with
 * tier-appropriate messaging.
 * 
 * Notification Flow:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                      NOTIFICATION CHANNELS                              │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │   Error Occurs → Classify Severity → Select Channel(s) → Send          │
 * │                                                                         │
 * │   Severity Levels:                                                      │
 * │   ┌─────────┬────────────────────────────────────────────────────────┐ │
 * │   │ INFO    │ In-app only (progress updates)                         │ │
 * │   │ WARNING │ In-app + optional email                                │ │
 * │   │ ERROR   │ In-app + email + admin alert                           │ │
 * │   │ CRITICAL│ All channels + owner notification + refund trigger     │ │
 * │   └─────────┴────────────────────────────────────────────────────────┘ │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 */

import { Tier } from "../../shared/pricing";
import { notifyOwner } from "../_core/notification";
import { AnalysisError, ErrorCategory, TIER_ERROR_CONFIGS } from "./errorHandling";
import { DegradedAnalysisResult, getRecoveryStatus } from "./gracefulDegradation";

// Simple email sending function using Resend
async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping email");
    return;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email send failed: ${error}`);
  }
}

// ============================================================================
// TYPES
// ============================================================================

export enum NotificationSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

export enum NotificationChannel {
  IN_APP = "in_app",
  EMAIL = "email",
  ADMIN_ALERT = "admin_alert",
  OWNER_NOTIFICATION = "owner_notification",
}

export interface NotificationPayload {
  sessionId: string;
  tier: Tier;
  severity: NotificationSeverity;
  title: string;
  message: string;
  userEmail?: string;
  channels: NotificationChannel[];
  metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  success: boolean;
  channelResults: Record<NotificationChannel, boolean>;
  timestamp: Date;
}

// ============================================================================
// NOTIFICATION TEMPLATES
// ============================================================================

const EMAIL_TEMPLATES = {
  analysisDelayed: (tier: Tier, estimatedMinutes: number) => ({
    subject: "Your Analysis is Taking a Bit Longer",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Your Analysis is Processing</h2>
        <p>We're working on your ${getTierName(tier)} analysis, but it's taking a bit longer than expected.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Estimated completion:</strong> ~${estimatedMinutes} minutes</p>
        </div>
        <p>You don't need to do anything - we'll email you as soon as it's ready.</p>
        <p style="color: #666; font-size: 14px;">Thank you for your patience!</p>
      </div>
    `,
  }),

  partialCompletion: (tier: Tier, completionPct: number, pendingParts: number[]) => ({
    subject: `Your Analysis is ${completionPct}% Complete`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Partial Analysis Ready</h2>
        <p>Good news! Most of your ${getTierName(tier)} analysis is ready for review.</p>
        <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: #2e7d32;">${completionPct}% Complete</p>
        </div>
        <p>We're still working on ${pendingParts.length} section(s). You can:</p>
        <ul>
          <li>View your completed sections now</li>
          <li>Wait for the full analysis (we'll notify you)</li>
        </ul>
        <a href="{{ANALYSIS_URL}}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Analysis</a>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">The remaining sections will be added automatically.</p>
      </div>
    `,
  }),

  analysisComplete: (tier: Tier) => ({
    subject: "Your Analysis is Complete! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Your ${getTierName(tier)} Analysis is Ready!</h2>
        <p>Great news! Your complete analysis is now available.</p>
        <a href="{{ANALYSIS_URL}}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Full Analysis</a>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">Thank you for using ValidateStrategy!</p>
      </div>
    `,
  }),

  analysisFailed: (tier: Tier, refundEligible: boolean) => ({
    subject: "Issue with Your Analysis - Action Required",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c62828;">We Encountered an Issue</h2>
        <p>We apologize, but we were unable to complete your ${getTierName(tier)} analysis.</p>
        <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #c62828;"><strong>What happened:</strong> Our analysis service experienced a technical issue.</p>
        </div>
        ${refundEligible ? `
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Your refund:</strong> A full refund has been initiated and will appear in 5-10 business days.</p>
        </div>
        ` : ""}
        <p>Our team has been notified and is working to prevent this in the future.</p>
        <p>If you have any questions, please reply to this email.</p>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">We sincerely apologize for the inconvenience.</p>
      </div>
    `,
  }),

  recoverySuccess: (tier: Tier, partNumber: number) => ({
    subject: "Your Analysis Has Been Updated",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">Section ${partNumber} is Now Ready!</h2>
        <p>We've successfully completed the missing section of your ${getTierName(tier)} analysis.</p>
        <a href="{{ANALYSIS_URL}}" style="display: inline-block; background: #1a1a1a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Updated Analysis</a>
        <p style="color: #666; font-size: 14px; margin-top: 24px;">Thank you for your patience!</p>
      </div>
    `,
  }),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTierName(tier: Tier): string {
  switch (tier) {
    case "standard":
      return "Observer";
    case "medium":
      return "Insider";
    case "full":
      return "Syndicate";
    default:
      return "Analysis";
  }
}

function selectChannels(severity: NotificationSeverity, tier: Tier): NotificationChannel[] {
  const channels: NotificationChannel[] = [NotificationChannel.IN_APP];

  switch (severity) {
    case NotificationSeverity.INFO:
      // In-app only
      break;

    case NotificationSeverity.WARNING:
      // Add email for paid tiers
      if (tier !== "standard") {
        channels.push(NotificationChannel.EMAIL);
      }
      break;

    case NotificationSeverity.ERROR:
      channels.push(NotificationChannel.EMAIL);
      channels.push(NotificationChannel.ADMIN_ALERT);
      break;

    case NotificationSeverity.CRITICAL:
      channels.push(NotificationChannel.EMAIL);
      channels.push(NotificationChannel.ADMIN_ALERT);
      channels.push(NotificationChannel.OWNER_NOTIFICATION);
      break;
  }

  return channels;
}

// ============================================================================
// NOTIFICATION SENDERS
// ============================================================================

async function sendInAppNotification(
  sessionId: string,
  title: string,
  message: string,
  severity: NotificationSeverity
): Promise<boolean> {
  // In-app notifications are stored in the database and polled by the frontend
  // This is handled by updating the analysis status
  console.log(`[InApp] Session ${sessionId}: ${severity} - ${title}`);
  return true;
}

async function sendEmailNotification(
  email: string,
  subject: string,
  html: string,
  sessionId: string
): Promise<boolean> {
  try {
    // Replace placeholder with actual URL
    const analysisUrl = `${process.env.VITE_APP_URL || "https://validatestrategy.com"}/analysis/${sessionId}`;
    const processedHtml = html.replace(/\{\{ANALYSIS_URL\}\}/g, analysisUrl);

    await sendEmail({
      to: email,
      subject,
      html: processedHtml,
    });
    console.log(`[Email] Sent to ${email}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send to ${email}:`, error);
    return false;
  }
}

async function sendAdminAlert(
  sessionId: string,
  tier: Tier,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  try {
    const alertMessage = `
🚨 Analysis Alert

Session: ${sessionId}
Tier: ${getTierName(tier)}
Issue: ${title}

${message}

${metadata ? `Metadata: ${JSON.stringify(metadata, null, 2)}` : ""}
    `.trim();

    console.log(`[AdminAlert] ${alertMessage}`);
    // In production, this would send to Slack, PagerDuty, etc.
    return true;
  } catch (error) {
    console.error("[AdminAlert] Failed:", error);
    return false;
  }
}

async function sendOwnerNotification(
  sessionId: string,
  tier: Tier,
  title: string,
  message: string
): Promise<boolean> {
  try {
    await notifyOwner({
      title: `[${getTierName(tier)}] ${title}`,
      content: `Session: ${sessionId}\n\n${message}`,
    });
    return true;
  } catch (error) {
    console.error("[OwnerNotification] Failed:", error);
    return false;
  }
}

// ============================================================================
// MAIN NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Send notification through all appropriate channels
 */
export async function sendNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const channelResults: Record<NotificationChannel, boolean> = {
    [NotificationChannel.IN_APP]: false,
    [NotificationChannel.EMAIL]: false,
    [NotificationChannel.ADMIN_ALERT]: false,
    [NotificationChannel.OWNER_NOTIFICATION]: false,
  };

  for (const channel of payload.channels) {
    switch (channel) {
      case NotificationChannel.IN_APP:
        channelResults[channel] = await sendInAppNotification(
          payload.sessionId,
          payload.title,
          payload.message,
          payload.severity
        );
        break;

      case NotificationChannel.EMAIL:
        if (payload.userEmail) {
          channelResults[channel] = await sendEmailNotification(
            payload.userEmail,
            payload.title,
            payload.message,
            payload.sessionId
          );
        }
        break;

      case NotificationChannel.ADMIN_ALERT:
        channelResults[channel] = await sendAdminAlert(
          payload.sessionId,
          payload.tier,
          payload.title,
          payload.message,
          payload.metadata
        );
        break;

      case NotificationChannel.OWNER_NOTIFICATION:
        channelResults[channel] = await sendOwnerNotification(
          payload.sessionId,
          payload.tier,
          payload.title,
          payload.message
        );
        break;
    }
  }

  const success = Object.values(channelResults).some((r) => r);

  return {
    success,
    channelResults,
    timestamp: new Date(),
  };
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Notify user that analysis is delayed
 */
export async function notifyAnalysisDelayed(
  sessionId: string,
  tier: Tier,
  userEmail: string,
  estimatedMinutes: number
): Promise<NotificationResult> {
  const template = EMAIL_TEMPLATES.analysisDelayed(tier, estimatedMinutes);
  
  return sendNotification({
    sessionId,
    tier,
    severity: NotificationSeverity.WARNING,
    title: template.subject,
    message: template.html,
    userEmail,
    channels: selectChannels(NotificationSeverity.WARNING, tier),
  });
}

/**
 * Notify user of partial completion
 */
export async function notifyPartialCompletion(
  sessionId: string,
  tier: Tier,
  userEmail: string,
  result: DegradedAnalysisResult
): Promise<NotificationResult> {
  const template = EMAIL_TEMPLATES.partialCompletion(
    tier,
    result.completionPercentage,
    result.failedParts.map((p) => p.partNumber)
  );
  
  return sendNotification({
    sessionId,
    tier,
    severity: NotificationSeverity.WARNING,
    title: template.subject,
    message: template.html,
    userEmail,
    channels: selectChannels(NotificationSeverity.WARNING, tier),
    metadata: {
      completionPercentage: result.completionPercentage,
      pendingParts: result.failedParts.map((p) => p.partNumber),
    },
  });
}

/**
 * Notify user that analysis is complete
 */
export async function notifyAnalysisComplete(
  sessionId: string,
  tier: Tier,
  userEmail: string
): Promise<NotificationResult> {
  const template = EMAIL_TEMPLATES.analysisComplete(tier);
  
  return sendNotification({
    sessionId,
    tier,
    severity: NotificationSeverity.INFO,
    title: template.subject,
    message: template.html,
    userEmail,
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
  });
}

/**
 * Notify user of complete failure
 */
export async function notifyAnalysisFailed(
  sessionId: string,
  tier: Tier,
  userEmail: string,
  refundEligible: boolean,
  error?: AnalysisError
): Promise<NotificationResult> {
  const template = EMAIL_TEMPLATES.analysisFailed(tier, refundEligible);
  
  return sendNotification({
    sessionId,
    tier,
    severity: NotificationSeverity.CRITICAL,
    title: template.subject,
    message: template.html,
    userEmail,
    channels: selectChannels(NotificationSeverity.CRITICAL, tier),
    metadata: {
      refundEligible,
      errorCode: error?.code,
      errorMessage: error?.message,
    },
  });
}

/**
 * Notify user that a failed part has been recovered
 */
export async function notifyRecoverySuccess(
  sessionId: string,
  tier: Tier,
  userEmail: string,
  partNumber: number
): Promise<NotificationResult> {
  const template = EMAIL_TEMPLATES.recoverySuccess(tier, partNumber);
  
  return sendNotification({
    sessionId,
    tier,
    severity: NotificationSeverity.INFO,
    title: template.subject,
    message: template.html,
    userEmail,
    channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
    metadata: { recoveredPart: partNumber },
  });
}

/**
 * Notify admin of critical error
 */
export async function notifyAdminCriticalError(
  sessionId: string,
  tier: Tier,
  error: AnalysisError
): Promise<NotificationResult> {
  const message = `
Critical error in analysis pipeline:

Error Code: ${error.code}
Category: ${error.category}
Message: ${error.message}
Retryable: ${error.isRetryable}

Stack: ${error.stack || "N/A"}
  `.trim();

  return sendNotification({
    sessionId,
    tier,
    severity: NotificationSeverity.CRITICAL,
    title: `Critical Analysis Error: ${error.code}`,
    message,
    channels: [NotificationChannel.ADMIN_ALERT, NotificationChannel.OWNER_NOTIFICATION],
    metadata: {
      errorCode: error.code,
      errorCategory: error.category,
      isRetryable: error.isRetryable,
    },
  });
}
