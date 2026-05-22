// resetPasswordTemplate.ts
export const resetPasswordTemplate = (username: string, link: string) => ({
  subject: "Reset Your Password",
  html: ` <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Password Reset</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="color: #333333;">Hello ${username || "User"},</h2>
        <p style="color: #555555;">We received a request to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="background-color: #007bff; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #777777;">If you didn’t request this, you can safely ignore this email.</p>
        <p style="color: #777777;">– The Team</p>
      </div>
    </body>
  </html>`,
});
