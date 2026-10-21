export const getOtpEmailTemplate = (otp: string) => {
  return `
  <div style="font-family: Arial; padding: 20px;">
    <h2>Shiparoo Verification</h2>
    
    <p>Your OTP is:</p>
    
    <h1 style="letter-spacing: 5px; color: #4CAF50;">
      ${otp}
    </h1>

    <p>This OTP is valid for 10 minutes.</p>

    <p>If you didn’t request this, ignore this email.</p>

    <br/>

    <p>Thanks,<br/>Shiparoo Team</p>
  </div>
  `;
};