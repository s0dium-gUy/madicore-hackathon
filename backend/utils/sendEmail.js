const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"MediCore Team" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[MediCore Mailer] Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error("[MediCore Mailer] Error sending email:", error.message);
    throw new Error(`Email sending failed: ${error.message}. Please configure secure credentials in your .env file.`);
  }
};

module.exports = sendEmail;
