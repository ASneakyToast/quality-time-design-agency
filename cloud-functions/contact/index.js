const nodemailer = require('nodemailer');

const ALLOWED_ORIGINS = [
  'https://qualitytime.fun',
  'http://localhost:4321',
];

const ALLOWED_SERVICES = [
  '',
  'branding',
  'web-design',
  'print-packaging',
  'art-direction',
  'motion',
  'environmental',
];

const SERVICE_LABELS = {
  '': 'General Inquiry',
  'branding': 'Branding',
  'web-design': 'Web Design',
  'print-packaging': 'Print & Packaging',
  'art-direction': 'Art Direction',
  'motion': 'Motion',
  'environmental': 'Environmental',
};

// Validate env vars at startup — fail fast rather than at request time
const { GMAIL_USER, GMAIL_APP_PASSWORD, RECAPTCHA_SECRET_KEY } = process.env;
if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !RECAPTCHA_SECRET_KEY) {
  throw new Error('Missing required environment variables: GMAIL_USER, GMAIL_APP_PASSWORD, RECAPTCHA_SECRET_KEY');
}

// Module-level singleton — reused across warm invocations
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

exports.handler = async (req, res) => {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }

  const { name: rawName, email, service, message: rawMessage, honeypot, recaptchaToken } = req.body;

  // Silent reject for bots
  if (honeypot) {
    return res.status(200).json({ success: true });
  }

  // Verify reCAPTCHA token
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret: RECAPTCHA_SECRET_KEY, response: recaptchaToken }),
  });
  const verifyData = await verifyRes.json();
  if (!verifyData.success || verifyData.action !== 'contact' || verifyData.score < 0.5) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const name = (rawName || '').trim();
  const message = (rawMessage || '').trim();

  // Validate required fields
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (name.length > 200) {
    return res.status(400).json({ error: 'Name must be 200 characters or fewer' });
  }
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (message.length > 5000) {
    return res.status(400).json({ error: 'Message must be 5,000 characters or fewer' });
  }

  // Validate service against known slugs; fall back to General Inquiry
  const serviceSlug = ALLOWED_SERVICES.includes(service) ? service : '';
  const serviceLabel = SERVICE_LABELS[serviceSlug];

  try {
    await transporter.sendMail({
      from: `"Quality Time Contact Form" <${GMAIL_USER}>`,
      to: GMAIL_USER,
      replyTo: email,
      subject: `New inquiry: ${stripNewlines(serviceLabel)} from ${stripNewlines(name)}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Service: ${serviceLabel}`,
        '',
        message,
      ].join('\n'),
      html: `
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Service:</strong> ${escapeHtml(serviceLabel)}</p>
        <hr>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Nodemailer error:', err.code ?? err.message ?? 'unknown');
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
};

// Strip CR/LF to prevent SMTP header injection via subject line
function stripNewlines(str) {
  return String(str).replace(/[\r\n]/g, ' ');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
