/**
 * Email Sequence Cron Job
 * 
 * This module provides an endpoint for processing the email nurturing sequence.
 * It should be called periodically (e.g., every hour) via a cron job or scheduled task.
 * 
 * The sequence timing:
 * - Email 1: Immediate (sent when user subscribes)
 * - Email 2: Day 2-3 after subscription
 * - Email 3: Day 5-7 after subscription
 * - Email 4: Day 10-14 after subscription (with PRIORITY offer)
 */

import { processEmailSequence } from "./emailNurturing";

/**
 * Process email sequence for all subscribers
 * Returns statistics about emails sent and errors
 */
export async function runEmailSequenceCron(): Promise<{
  success: boolean;
  sent: number;
  errors: number;
  timestamp: string;
}> {
  console.log("[EmailCron] Starting email sequence processing...");
  
  try {
    const result = await processEmailSequence();
    
    console.log(`[EmailCron] Completed: ${result.sent} emails sent, ${result.errors} errors`);
    
    return {
      success: true,
      sent: result.sent,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[EmailCron] Failed to process email sequence:", error);
    
    return {
      success: false,
      sent: 0,
      errors: 1,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export for use in tRPC router
export { processEmailSequence };
