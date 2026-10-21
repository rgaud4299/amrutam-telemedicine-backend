export const getResetPasswordEmailTemplate = (resetLink: string) => {
  return `
  <div style="font-family: Arial; padding: 20px; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #1a1a6e;">Shiparoo — Reset Your Password</h2>

    <p>We received a request to reset the password for your Shiparoo account.</p>
    <p>Click the button below to set a new password. This link is valid for <strong>15 minutes</strong>.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}"
        style="background-color: #f97316; color: #fff; padding: 14px 28px;
               text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold;">
        Reset Password
      </a>
    </div>

    <p style="color: #666; font-size: 13px;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${resetLink}" style="color: #f97316;">${resetLink}</a>
    </p>

    <p style="color: #666; font-size: 13px;">
      If you didn't request this, you can safely ignore this email. Your password will not change.
    </p>

    <br/>
    <p>Thanks,<br/>Shiparoo Team</p>
  </div>
  `;
};
