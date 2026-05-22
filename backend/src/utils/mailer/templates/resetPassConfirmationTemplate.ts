export const resetPassConfirmationTemplate = (username: string = "User") => ({
  subject: "Your Password Has Been Successfully Reset",
  html: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset Confirmation</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <h2 style="color: #2c3e50;">Hi ${username},</h2>
      <p style="color: #555555; font-size: 16px;">
        This is a confirmation that your password has been successfully changed.
      </p>
      <p style="color: #555555; font-size: 16px;">
        If you did not perform this action, please contact our support team immediately.
      </p>
      <p style="color: #777777; font-size: 14px; margin-top: 30px;">– The Team</p>
    </div>
  </body>
  </html>
  `,
});
