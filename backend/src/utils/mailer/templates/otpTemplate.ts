// otpTemplate.ts
export const otpTemplate = (username: string, code: string) => ({
  subject: "Your Verification Code",
  html: `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Email Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="color: #333333;">Hello ${username || "User"},</h2>
        <p style="color: #555555;">Thank you for signing up. Use the verification code below to complete your registration:</p>
        <div style="font-size: 32px; font-weight: bold; color: #2c3e50; text-align: center; margin: 20px 0;">${code}</div>
        <p style="color: #777777;">If you didn’t request this, please ignore this email.</p>
        <p style="color: #777777;">– The Team</p>
      </div>
    </body>
  </html>
  `,
});
