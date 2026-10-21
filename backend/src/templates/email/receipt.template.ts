export const getReceiptEmailTemplate = (shipment: any) => {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e5e7eb; border-radius: 8px;">
    <h2 style="color: #1a1a6e; margin-bottom: 5px;">Shiparoo — Payment Receipt</h2>
    <p style="font-size: 14px; color: #666; margin-top: 0;">Thank you for your purchase. Your shipping label is ready!</p>
    
    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #111; font-size: 16px;">Shipment Details</h3>
      <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; font-weight: bold; color: #666;">Tracking Number:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #f97316;">${shipment.trackingNumber}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: bold; color: #666;">Carrier:</td>
          <td style="padding: 4px 0; text-align: right;">${shipment.carrier}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: bold; color: #666;">Rate Paid:</td>
          <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #10b981;">$${shipment.rate.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: bold; color: #666;">Weight / Dimensions:</td>
          <td style="padding: 4px 0; text-align: right;">${shipment.weight} lbs (${shipment.length}x${shipment.width}x${shipment.height} in)</td>
        </tr>
      </table>
    </div>

    <div style="margin: 20px 0; font-size: 14px;">
      <div style="margin-bottom: 15px;">
        <strong style="color: #111;">From:</strong>
        <p style="margin: 4px 0 0 0; color: #555;">${shipment.fromAddress}</p>
      </div>
      <div>
        <strong style="color: #111;">To:</strong>
        <p style="margin: 4px 0 0 0; color: #555;">${shipment.toAddress}</p>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${shipment.labelUrl}"
        style="background-color: #1a1a6e; color: #fff; padding: 14px 28px;
               text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
        Download Shipping Label
      </a>
    </div>

    <p style="font-size: 12px; color: #888; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px;">
      This email serves as your receipt. If you have any questions or require support, please contact us.
    </p>
    <p style="font-size: 12px; color: #888; text-align: center; margin-top: 5px;">
      Thanks,<br/>Shiparoo Team
    </p>
  </div>
  `;
};
