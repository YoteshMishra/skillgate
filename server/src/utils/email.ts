import dns from "dns";
import nodemailer from "nodemailer";

// Basic format check
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Checks that the email is well-formed AND that its domain actually has
// mail servers configured (MX records). This rejects fake/placeholder
// domains like example.com or test.com, which have no real MX records.
export async function isValidEmail(email: string): Promise<boolean> {
  if (!EMAIL_REGEX.test(email)) return false;

  const domain = email.split("@")[1];
if (!domain) return false;

  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// Lazily-created Ethereal test transporter (fake SMTP for development —
// emails never actually leave Ethereal's servers, but you get a preview
// link to view exactly what would have been sent).
let transporterPromise: ReturnType<typeof createTransporter> | null = null;

async function createTransporter() {
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

async function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = createTransporter();
  }
  return transporterPromise;
}

export async function sendOtpEmail(to: string, otp: string): Promise<string> {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: '"SkillGate" <no-reply@skillgate.dev>',
    to,
    subject: "Your SkillGate password reset code",
    text: `Your one-time password reset code is: ${otp}\n\nThis code expires in 10 minutes.`,
    html: `<p>Your one-time password reset code is:</p><h2>${otp}</h2><p>This code expires in 10 minutes.</p>`,
  });

  // Returns a preview URL — open this in a browser to see the "sent" email
  const previewUrl = nodemailer.getTestMessageUrl(info);
  return previewUrl || "";
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}