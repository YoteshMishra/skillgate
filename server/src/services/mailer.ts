// Sends email through Brevo's HTTPS API (Render's free plan blocks SMTP ports)
export async function sendResetEmail(to: string, link: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.MAIL_FROM_EMAIL;

  // Dev fallback: no key configured, so print the link in the server console
  if (!apiKey || !senderEmail) {
    console.log(`\n[DEV] Password reset link for ${to}:\n${link}\n`);
    return;
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "SkillGate", email: senderEmail },
      to: [{ email: to }],
      subject: "Reset your SkillGate password",
      htmlContent: `<p>We received a request to reset your password.</p>
        <p><a href="${link}">Reset password</a></p>
        <p>This link expires in 1 hour. If you didn't ask for this, ignore this email.</p>`,
    }),
  });

  if (!res.ok) {
    throw new Error(`Brevo error ${res.status}: ${await res.text()}`);
  }
}