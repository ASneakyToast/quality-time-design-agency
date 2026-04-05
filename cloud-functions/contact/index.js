const nodemailer = require('nodemailer');

const ALLOWED_ORIGINS = [
  'https://qualitytime.fun',
  'http://localhost:4321',
];

exports.handler = async (req, res) => {
  // Set CORS headers unconditionally before any early returns
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
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

  const { name, email, service, message, honeypot } = req.body;

  // Silent reject for bots
  if (honeypot) {
    return res.status(200).json({ success: true });
  }

  // Validate required fields
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }
  if (message.length > 5000) {
    return res.status(400).json({ error: 'Message must be 5,000 characters or fewer' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const serviceLabel = service || 'General Inquiry';

  try {
    await transporter.sendMail({
      from: `"Quality Time Contact Form" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `New inquiry: ${serviceLabel} from ${name}`,
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
    console.error('Nodemailer error:', err);
    return res.status(500).json({ error: 'Failed to send message. Please try again.' });
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&(?![\w#]+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
