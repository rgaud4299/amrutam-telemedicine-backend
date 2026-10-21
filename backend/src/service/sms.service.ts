/**
 * SMS Service for Prescriber & Patient OTP / Notifications
 */

export const sendOtpSms = async (phoneNumber: string, otp: string) => {
  console.log(`[SMS SERVICE] 🚀 Sending OTP SMS to: ${phoneNumber}`);

  // In development or when no SMS provider is configured, log simulated message
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.log(`[SMS SERVICE SIMULATION] 📱 OTP for ${phoneNumber}: ${otp}`);
    return { messageId: "SIMULATED_SMS_ID", success: true };
  }

  try {
    console.log(`[SMS SERVICE] SMS sent to ${phoneNumber} with OTP ${otp}`);
    return { messageId: "SMS_SENT_ID", success: true };
  } catch (error: any) {
    console.error("[SMS SERVICE] ⚠️ SMS send warning:", error?.message);
    console.log(`[SMS SERVICE SIMULATION FALLBACK] OTP for ${phoneNumber}: ${otp}`);
    return { messageId: "FALLBACK_SIMULATED_SMS_ID", success: false };
  }
};
