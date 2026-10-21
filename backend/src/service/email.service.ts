import nodemailer from "nodemailer";
import { getOtpEmailTemplate } from "../templates/email/otp.template";
import { getResetPasswordEmailTemplate } from "../templates/email/resetPassword.template";

const smtpPort = Number(process.env.SMTP_PORT) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: smtpPort,
  secure: smtpPort === 465,
  auth: process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD ? {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  } : undefined,
});

export const sendOtpEmail = async (to: string, otp: string) => {
  console.log(`[EMAIL SERVICE] 🚀 Sending OTP email to: ${to}`);
  
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.log(`[EMAIL SERVICE SIMULATION] OTP for ${to}: ${otp}`);
    return { messageId: "SIMULATED_MSG_ID" };
  }

  try {
    const html = getOtpEmailTemplate(otp);
    const mailOptions = {
      from: `"MediPack Prescriber Portal" <${process.env.SMTP_EMAIL}>`,
      to,
      subject: "Your Verification Code for MediPack",
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("[EMAIL SERVICE] ✅ OTP Email sent successfully:", info.messageId);
    return info;
  } catch (error: any) {
    console.error("[EMAIL SERVICE] ⚠️ SMTP Send warning:", error?.message);
    console.log(`[EMAIL SERVICE SIMULATION FALLBACK] OTP for ${to}: ${otp}`);
    return { messageId: "FALLBACK_SIMULATED_MSG_ID" };
  }
};

export const sendResetPasswordEmail = async (to: string, resetLink: string) => {
  console.log(`[EMAIL SERVICE] 🚀 Sending Reset Password email to: ${to}`);
  
  if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.log(`[EMAIL SERVICE SIMULATION] Reset link for ${to}: ${resetLink}`);
    return { messageId: "SIMULATED_MSG_ID" };
  }

  try {
    const html = getResetPasswordEmailTemplate(resetLink);
    const mailOptions = {
      from: `"MediPack Prescriber Portal" <${process.env.SMTP_EMAIL}>`,
      to,
      subject: "Reset Your MediPack Password",
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("[EMAIL SERVICE] ✅ Reset Password Email sent successfully:", info.messageId);
    return info;
  } catch (error: any) {
    console.error("[EMAIL SERVICE] ⚠️ SMTP Send warning:", error?.message);
    console.log(`[EMAIL SERVICE SIMULATION FALLBACK] Reset link for ${to}: ${resetLink}`);
    return { messageId: "FALLBACK_SIMULATED_MSG_ID" };
  }
};