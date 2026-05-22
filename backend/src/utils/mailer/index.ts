import { transporter } from "./transporter";
import { otpTemplate } from "./templates/otpTemplate";
import { resetPasswordTemplate } from "./templates/resetPasswordTemplate";
import { resetPassConfirmationTemplate } from "./templates/resetPassConfirmationTemplate";

type MailType = "otp" | "resetPassword" | "resetPassConfirmation";

export const mailer = async (
  email: string,
  username: string = "User",
  codeOrLink?: string,
  type: MailType = "otp"
) => {
  let subject = "";
  let html = "";

  if (type === "otp" && codeOrLink) {
    ({ subject, html } = otpTemplate(username, codeOrLink));
  } else if (type === "resetPassword" && codeOrLink) {
    ({ subject, html } = resetPasswordTemplate(username, codeOrLink));
  } else if (type === "resetPassConfirmation") {
    ({ subject, html } = resetPassConfirmationTemplate(username));
  } else {
    return {
      success: false,
      message: "Invalid parameters for sending email.",
    };
  }
  // console.log("mailer here");
  try {
    await transporter.sendMail({
      from: "niroshshetty@gmail.com",
      to: email,
      subject,
      html,
    });

    return {
      success: true,
      message: `${type} email sent successfully.`,
    };
  } catch (error: any) {
    console.error("Mailer error:", error);
    return {
      success: false,
      message: `Failed to send email: ${error.message}`,
    };
  }
};
