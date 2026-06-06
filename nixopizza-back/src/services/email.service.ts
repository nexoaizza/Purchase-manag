import nodemailer from "nodemailer";

export const sendStaffWelcomeEmail = async (
  to: string,
  fullname: string,
  password: string,
  appLink: string
): Promise<boolean> => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '"Nixopizza" <noreply@nixopizza.com>',
      to,
      subject: "Welcome to Nixopizza - Your Staff Account",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Welcome, ${fullname}!</h2>
          <p>Your staff account has been successfully created.</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Your Email:</strong> ${to}</p>
            <p style="margin: 5px 0;"><strong>Your Password:</strong> ${password}</p>
          </div>
          <p>You can download our staff application using the link below:</p>
          <a href="${appLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Download App</a>
          <br /><br />
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p><a href="${appLink}">${appLink}</a></p>
          <br />
          <p>Thank you,<br/>Nixopizza Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};
