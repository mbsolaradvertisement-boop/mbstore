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

const sendPasswordReset = (email, name, resetUrl) => sendMail({ to: email, subject: "Reset your MB Store password", html: shell("Reset your password", name, `<p style="line-height:1.7">Use the secure link below to create a new password. It expires in 30 minutes.</p><p style="margin:24px 0"><a href="${escapeHtml(resetUrl)}" style="display:inline-block;padding:13px 20px;border-radius:12px;background:#0f766e;color:#fff;text-decoration:none;font-weight:700">Reset password</a></p>`) });
const sendWelcomeCustomer = (email, name) => sendMail({ to: email, subject: "Welcome to MB Store", html: shell("Welcome to MB Store", name, "<p style=\"line-height:1.7\">Your customer account is ready. You can now discover products from verified sellers.</p>") });
const sendSellerDecision = (email, name, approved) => sendMail({ to: email, subject: approved ? "Your Seller Account has been Approved" : "Seller Verification Update", html: shell(approved ? "Seller account approved" : "Seller verification update", name, approved ? "<p>Your seller account is approved. You can now sign in to your dashboard.</p>" : "<p>Your seller application was not approved. Please contact support for more details.</p>") });
const sendProductModeration = (email, name, product, suspended, reason) => {
  const supportEmail = process.env.SUPPORT_EMAIL || "support@mbstore.com";
  const heading = suspended ? "Product suspended" : "Product suspension removed";
  const subject = `${heading}: ${product.productCode}`;
  const content = suspended
    ? `<div style="margin:20px 0;padding:18px;background:#fef2f2;border:1px solid #fecaca;border-radius:14px"><p style="margin:0 0 8px;color:#991b1b;font-weight:700">${escapeHtml(product.productName)}</p><p style="margin:0 0 8px"><strong>Product ID:</strong> ${escapeHtml(product.productCode)}</p><p style="margin:0;color:#7f1d1d"><strong>Administrator note:</strong> ${escapeHtml(reason)}</p></div><p style="line-height:1.7">This product is now hidden from the catalogue and cannot be edited while suspended.</p><p style="line-height:1.7">For questions, email <a href="mailto:${escapeHtml(supportEmail)}">${escapeHtml(supportEmail)}</a> and include product ID <strong>${escapeHtml(product.productCode)}</strong>.</p>`
    : `<div style="margin:20px 0;padding:18px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:14px"><p style="margin:0 0 8px;color:#065f46;font-weight:700">${escapeHtml(product.productName)}</p><p style="margin:0"><strong>Product ID:</strong> ${escapeHtml(product.productCode)}</p></div><p style="line-height:1.7">The administrator removed the suspension. Your product is active and visible in the catalogue again.</p>`;
  return sendMail({ to: email, subject, html: shell(heading, name, content) });
};

module.exports = { sendPasswordReset, sendWelcomeCustomer, sendSellerDecision, sendProductModeration };
