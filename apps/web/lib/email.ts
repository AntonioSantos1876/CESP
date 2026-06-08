import { Resend } from 'resend'

const FROM = 'Clarendon Elite Cup <noreply@clarendonelitecup.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://clarendon-elite-sports-program.vercel.app'

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function base(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background:#111;border:1px solid #1e1e1e;border-radius:16px;overflow:hidden;">
    <tr>
      <td style="background:#111;padding:32px 32px 0;text-align:center;">
        <span style="display:inline-block;background:linear-gradient(135deg,#f59e0b,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:22px;font-weight:800;letter-spacing:-0.5px;">CESP</span>
        <p style="color:#6b7280;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:4px 0 0;">Clarendon Elite Sports Program</p>
      </td>
    </tr>
    <tr><td style="padding:28px 32px 32px;">${body}</td></tr>
    <tr>
      <td style="border-top:1px solid #1e1e1e;padding:20px 32px;text-align:center;">
        <p style="color:#4b5563;font-size:12px;margin:0;">
          <a href="${APP_URL}" style="color:#f59e0b;text-decoration:none;">clarendonelitecup.com</a>
          &nbsp;&middot;&nbsp;
          <a href="mailto:clarendonelitecup@gmail.com" style="color:#4b5563;text-decoration:none;">clarendonelitecup@gmail.com</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendPurchaseConfirmation(opts: {
  to: string
  name?: string
  amount: number
  currency?: string
  sessionId: string
}) {
  const resend = getResend()
  if (!resend) return

  const display = opts.name ? opts.name.split(' ')[0] : 'there'
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: opts.currency?.toUpperCase() ?? 'USD',
  }).format(opts.amount)

  const html = base('Order confirmed', `
    <h1 style="color:#f5f5f5;font-size:22px;font-weight:700;margin:0 0 8px;">Order confirmed</h1>
    <p style="color:#9ca3af;font-size:15px;margin:0 0 24px;">Thanks ${display}, your purchase is through.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;border:1px solid #1e1e1e;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 4px;">Amount paid</p>
          <p style="color:#f5f5f5;font-size:24px;font-weight:700;margin:0;">${formattedAmount}</p>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:13px;margin:0 0 20px;">You'll receive a separate shipping confirmation once your order ships. If you have questions, reply to this email.</p>
    <a href="${APP_URL}/shop" style="display:inline-block;background:#f59e0b;color:#000;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">Back to shop</a>
  `)

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Order confirmed - ${formattedAmount}`,
    html,
  })
}

export async function sendDonationConfirmation(opts: {
  to: string
  name?: string
  amount: number
  currency?: string
}) {
  const resend = getResend()
  if (!resend) return

  const display = opts.name ? opts.name.split(' ')[0] : 'there'
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: opts.currency?.toUpperCase() ?? 'USD',
  }).format(opts.amount)

  const html = base('Thank you for your donation', `
    <h1 style="color:#f5f5f5;font-size:22px;font-weight:700;margin:0 0 8px;">Thank you for your support</h1>
    <p style="color:#9ca3af;font-size:15px;margin:0 0 24px;">Hi ${display}, your donation means a lot to the league and the community it serves.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;border:1px solid #1e1e1e;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="color:#6b7280;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 4px;">Donation received</p>
          <p style="color:#f5f5f5;font-size:24px;font-weight:700;margin:0;">${formattedAmount}</p>
          <p style="color:#6b7280;font-size:12px;margin:6px 0 0;">100% goes directly into running the league.</p>
        </td>
      </tr>
    </table>
    <a href="${APP_URL}" style="display:inline-block;background:#f59e0b;color:#000;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">Visit CESP</a>
  `)

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Donation confirmed - ${formattedAmount} - Thank you!`,
    html,
  })
}

export async function sendWelcomeEmail(opts: {
  to: string
  name?: string
}) {
  const resend = getResend()
  if (!resend) return

  const display = opts.name ? opts.name.split(' ')[0] : 'there'

  const html = base('Welcome to CESP', `
    <h1 style="color:#f5f5f5;font-size:22px;font-weight:700;margin:0 0 8px;">Welcome to CESP</h1>
    <p style="color:#9ca3af;font-size:15px;margin:0 0 24px;">Hi ${display}, you're now part of the Clarendon Elite Sports Program community.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="padding:0 0 12px;">
          <a href="${APP_URL}/fixtures" style="display:block;background:#0d0d0d;border:1px solid #1e1e1e;border-radius:12px;padding:16px 20px;text-decoration:none;">
            <p style="color:#f59e0b;font-size:13px;font-weight:700;margin:0 0 4px;">Fixtures</p>
            <p style="color:#6b7280;font-size:13px;margin:0;">See the full match schedule and results.</p>
          </a>
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 12px;">
          <a href="${APP_URL}/shop" style="display:block;background:#0d0d0d;border:1px solid #1e1e1e;border-radius:12px;padding:16px 20px;text-decoration:none;">
            <p style="color:#f59e0b;font-size:13px;font-weight:700;margin:0 0 4px;">Shop</p>
            <p style="color:#6b7280;font-size:13px;margin:0;">Pick up your school's jersey shirt and merch.</p>
          </a>
        </td>
      </tr>
      <tr>
        <td>
          <a href="${APP_URL}/donate" style="display:block;background:#0d0d0d;border:1px solid #1e1e1e;border-radius:12px;padding:16px 20px;text-decoration:none;">
            <p style="color:#f59e0b;font-size:13px;font-weight:700;margin:0 0 4px;">Support the league</p>
            <p style="color:#6b7280;font-size:13px;margin:0;">Every donation keeps the league running for the community.</p>
          </a>
        </td>
      </tr>
    </table>
    <p style="color:#6b7280;font-size:12px;margin:0;">Check your email for a confirmation link if you signed up with email and password.</p>
  `)

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: 'Welcome to the Clarendon Elite Cup',
    html,
  })
}

export async function sendMatchNotification(opts: {
  to: string | string[]
  homeTeam: string
  awayTeam: string
  matchDate: string
  venue?: string
}) {
  const resend = getResend()
  if (!resend) return

  const date = new Date(opts.matchDate)
  const formattedDate = date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const html = base('Upcoming match', `
    <h1 style="color:#f5f5f5;font-size:22px;font-weight:700;margin:0 0 8px;">Upcoming fixture</h1>
    <p style="color:#9ca3af;font-size:15px;margin:0 0 24px;">A match you might be interested in is coming up.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;border:1px solid #1e1e1e;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr>
        <td style="padding:20px;">
          <p style="color:#f59e0b;font-size:18px;font-weight:800;text-align:center;margin:0 0 16px;">${opts.homeTeam} vs ${opts.awayTeam}</p>
          <p style="color:#9ca3af;font-size:14px;text-align:center;margin:0;">${formattedDate} at ${formattedTime}</p>
          ${opts.venue ? `<p style="color:#6b7280;font-size:13px;text-align:center;margin:6px 0 0;">${opts.venue}</p>` : ''}
        </td>
      </tr>
    </table>
    <a href="${APP_URL}/fixtures" style="display:inline-block;background:#f59e0b;color:#000;font-weight:700;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">View fixtures</a>
  `)

  const recipients = Array.isArray(opts.to) ? opts.to : [opts.to]

  await resend.emails.send({
    from: FROM,
    to: recipients,
    subject: `Upcoming: ${opts.homeTeam} vs ${opts.awayTeam} - ${formattedDate}`,
    html,
  })
}
