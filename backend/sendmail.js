const axios = require("axios");
require("dotenv").config();
const fs = require("fs");

// ================== SEND NORMAL MAIL ==================
const sendMail = async ({ to, subject, html }) => {
  try {
    console.log("📧 Sending email to:", to);

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Farmora Crops",
          email: process.env.EMAIL_USER, // MUST be verified in Brevo
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Email sent successfully via Brevo");
    return { success: true };

  } catch (error) {
    console.error("❌ Email error:", error.response?.data || error.message);
    return { success: false };
  }
};

// ================== SEND INVOICE EMAIL ==================
const sendOrderInvoiceEmail = async ({ to, subject, html, attachments }) => {
  try {
    console.log("📧 Sending invoice email to:", to);

    const attachmentData = attachments?.map(file => ({
      name: file.filename,
      content: fs.readFileSync(file.path).toString("base64"),
    }));

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Farmora Crops",
          email: process.env.EMAIL_USER,
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html,
        attachment: attachmentData,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Invoice email sent successfully");

    // 🧹 delete temp files
    if (attachments) {
      attachments.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
          console.log("🗑️ Deleted:", file.path);
        }
      });
    }

    return { success: true };

  } catch (error) {
    console.error("❌ Invoice email error:", error.response?.data || error.message);
    return { success: false };
  }
};

module.exports = {
  sendMail,
  sendOrderInvoiceEmail
};