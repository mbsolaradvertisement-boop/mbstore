const nodemailer = require("nodemailer");

let transporter;
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS?.replace(/\s/g, "") },
    });
  }
  return transporter;
}

const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
const shell = (title, name, content) => `<!doctype html><html><body style="margin:0;background:#f0fdfa;font-family:Arial,sans-serif;color:#0f172a"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px"><table width="100%" style="max-width:560px;background:#fff;border-radius:20px;overflow:hidden"><tr><td style="background:#0f766e;padding:24px 32px;color:#fff;font-size:24px;font-weight:800">MB Store</td></tr><tr><td style="padding:32px"><h1 style="font-size:24px;margin:0 0 20px">${title}</h1><p style="line-height:1.7">Hello ${escapeHtml(name || "there")},</p>${content}<p style="margin-top:28px;color:#64748b;font-size:13px;line-height:1.6">If you did not request this, you can safely ignore this email.</p></td></tr><tr><td style="padding:20px 32px;background:#f8fafc;color:#64748b;font-size:12px">MB Store · ${escapeHtml(process.env.SUPPORT_EMAIL || "support@mbstore.com")}</td></tr></table></td></tr></table></body></html>`;

async function sendMail({ to, subject, html }) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) throw Object.assign(new Error("Email service is not configured."), { status: 503, code: "EMAIL_NOT_CONFIGURED" });
  try {
    return await getTransporter().sendMail({ from: process.env.MAIL_FROM || `MB Store <${process.env.SMTP_USER}>`, to, subject, html });
  } catch (error) {
    console.error("Email delivery failed:", error.code || error.message);
    throw Object.assign(new Error("Unable to send the verification email. Check the SMTP configuration and try again."), { status: 502, code: "EMAIL_DELIVERY_FAILED" });
  }
}

const sendOtpEmail = (email, otp, name) => sendMail({ to: email, subject: "Your MB Store verification code", html: shell("Verify your email", name, `<p style="line-height:1.7">Use this one-time code to continue:</p><div style="margin:24px 0;padding:20px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:14px;text-align:center;font-size:34px;font-weight:800;letter-spacing:10px;color:#0f766e">${otp}</div><p>This code expires in <strong>10 minutes</strong>.</p>`) });
const sendWelcomeCustomer = (email, name) => sendMail({ to: email, subject: "Welcome to MB Store", html: shell("Welcome to MB Store", name, "<p style=\"line-height:1.7\">Your customer account is ready. You can now discover products from verified sellers.</p>") });
const sendSellerDecision = (email, name, approved) => sendMail({ to: email, subject: approved ? "Your Seller Account has been Approved" : "Seller Verification Update", html: shell(approved ? "Seller account approved" : "Seller verification update", name, approved ? "<p>Your seller account is approved. You can now sign in to your dashboard.</p>" : "<p>Your seller application was not approved. Please contact support for more details.</p>") });

module.exports = { sendOtpEmail, sendWelcomeCustomer, sendSellerDecision };
