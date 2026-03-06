const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'Sonnetary <onboarding@resend.dev>';

/**
 * Send a payment/order confirmation email.
 * @param {object} params
 * @param {string} params.to - Customer email
 * @param {string} params.orderId - Short order reference
 * @param {string} params.genre - Song genre
 * @param {string} params.mood - Song mood
 * @param {string} params.deliveryDate - ISO date string
 * @param {string} params.reference - Paystack reference
 */
async function sendConfirmationEmail({ to, orderId, genre, mood, deliveryDate, reference }) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_placeholder')) {
    console.log('[Email] Resend not configured — skipping email to:', to);
    return;
  }

  const delivery = new Date(deliveryDate).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #f0f0f0; margin: 0; padding: 0; }
    .container { max-width: 540px; margin: 40px auto; background: #141414; border-radius: 16px; overflow: hidden; border: 1px solid #242424; }
    .header { background: linear-gradient(135deg, #e11d48, #9f1239); padding: 40px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; color: white; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }
    .body { padding: 32px; }
    .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #242424; }
    .row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-size: 13px; }
    .value { color: #f9fafb; font-size: 13px; font-weight: 600; text-align: right; }
    .cta { display: block; margin: 24px 0 0; padding: 14px; background: #e11d48; color: white; text-decoration: none; border-radius: 10px; text-align: center; font-weight: 700; font-size: 15px; }
    .footer { padding: 24px 32px; background: #0f0f0f; text-align: center; color: #4b5563; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎵 Sonnetary</h1>
      <p>Your custom song is in production!</p>
    </div>
    <div class="body">
      <p style="color:#d1d5db; line-height:1.6;">Thank you for your order. Our team of professional artists has received your brief and will begin composing your unique song immediately.</p>
      <div style="background:#1c1c1c; border-radius:10px; padding:16px; margin: 20px 0;">
        <div class="row"><span class="label">Order ID</span><span class="value">#${orderId}</span></div>
        <div class="row"><span class="label">Genre</span><span class="value">${genre || 'Custom'}</span></div>
        <div class="row"><span class="label">Mood</span><span class="value">${mood || 'Custom'}</span></div>
        <div class="row"><span class="label">Amount Paid</span><span class="value">₦30,000</span></div>
        <div class="row"><span class="label">Estimated Delivery</span><span class="value">${delivery}</span></div>
        <div class="row"><span class="label">Payment Ref</span><span class="value" style="font-size:11px; font-family:monospace;">${reference}</span></div>
      </div>
      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/track" class="cta">Track Your Order →</a>
    </div>
    <div class="footer">Sonnetary • Your story, our music. © ${new Date().getFullYear()}</div>
  </div>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `🎵 Your Sonnetary order #${orderId} is in production!`,
      html,
    });
    console.log('[Email] Sent confirmation to:', to, '| ID:', result.data?.id);
    return result;
  } catch (err) {
    console.error('[Email] Failed to send confirmation email:', err.message);
  }
}
/**
 * Send a magic link login email.
 * @param {object} params
 * @param {string} params.to - Customer email
 * @param {string} params.token - Magic link token
 */
async function sendMagicLinkEmail({ to, token }) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith('re_placeholder')) {
    console.log('[Email] Resend not configured — skipping magic link to:', to, '| token:', token);
    return;
  }

  const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/#/verify?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #f0f0f0; margin: 0; padding: 0; }
    .container { max-width: 540px; margin: 40px auto; background: #141414; border-radius: 16px; overflow: hidden; border: 1px solid #242424; }
    .header { background: linear-gradient(135deg, #e11d48, #9f1239); padding: 40px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; color: white; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px; }
    .body { padding: 32px; text-align: center; }
    .cta { display: inline-block; margin: 24px 0; padding: 14px 28px; background: #e11d48; color: white; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; }
    .footer { padding: 24px 32px; background: #0f0f0f; text-align: center; color: #4b5563; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎵 Sonnetary</h1>
      <p>Sign in to your account</p>
    </div>
    <div class="body">
      <p style="color:#d1d5db; line-height:1.6;">Click the button below to securely sign in to Sonnetary. This link will expire in 15 minutes.</p>
      <a href="${loginUrl}" class="cta">Sign In to Sonnetary</a>
      <p style="color:#6b7280; font-size:12px; margin-top:20px;">If you didn't request this email, you can safely ignore it.</p>
    </div>
    <div class="footer">Sonnetary • Your story, our music. © ${new Date().getFullYear()}</div>
  </div>
</body>
</html>`;

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '🎵 Sign in to Sonnetary',
      html,
    });
    console.log('[Email] Sent magic link to:', to, '| ID:', result.data?.id);
    return result;
  } catch (err) {
    console.error('[Email] Failed to send magic link email:', err.message);
  }
}

module.exports = { sendConfirmationEmail, sendMagicLinkEmail };
