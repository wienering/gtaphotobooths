import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper function to set CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  // Set CORS headers for all responses
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the request body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { name, email, phone, 'event-date': eventDate, 'event-type': eventType, message } = body;

    // Validate required fields
    if (!name || !email || !phone || !eventDate) {
      return res.status(400).json({ error: 'Name, email, phone, and event date are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Format the email content with styled HTML
    const emailContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 2rem;
            background-color: #ffffff;
          }
          .email-header {
            border-bottom: 3px solid #4d0d6d;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
          }
          .email-header h2 {
            color: #4d0d6d;
            font-size: 1.75rem;
            margin: 0;
            font-weight: 600;
          }
          .email-content {
            background-color: #ffffff;
          }
          .field-group {
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #ecf0f1;
          }
          .field-group:last-child {
            border-bottom: none;
          }
          .field-label {
            color: #4d0d6d;
            font-weight: 600;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 0.5rem;
            display: block;
          }
          .field-value {
            color: #333333;
            font-size: 1rem;
            margin: 0;
          }
          .message-content {
            background-color: #f8f9fa;
            padding: 1rem;
            border-radius: 5px;
            border-left: 3px solid #5ab5d5;
            margin-top: 0.5rem;
          }
          .email-footer {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            color: #666666;
            font-size: 0.875rem;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h2>New Contact Form Submission</h2>
          </div>
          <div class="email-content">
            <div class="field-group">
              <span class="field-label">Name</span>
              <p class="field-value">${name}</p>
            </div>
            <div class="field-group">
              <span class="field-label">Email</span>
              <p class="field-value"><a href="mailto:${email}" style="color: #5ab5d5; text-decoration: none;">${email}</a></p>
            </div>
            <div class="field-group">
              <span class="field-label">Phone</span>
              <p class="field-value"><a href="tel:${phone.replace(/\D/g, '')}" style="color: #5ab5d5; text-decoration: none;">${phone}</a></p>
            </div>
            <div class="field-group">
              <span class="field-label">Event Date</span>
              <p class="field-value">${eventDate}</p>
            </div>
            ${eventType ? `
            <div class="field-group">
              <span class="field-label">Event Type</span>
              <p class="field-value">${eventType.charAt(0).toUpperCase() + eventType.slice(1)}</p>
            </div>
            ` : ''}
            ${message ? `
            <div class="field-group">
              <span class="field-label">Message</span>
              <div class="message-content">${message.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}
          </div>
          <div class="email-footer">
            <p>This email was sent from the GTA Photo Booths contact form.</p>
            <p>Reply directly to this email to respond to ${name}.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    // Send email using Resend
    const data = await resend.emails.send({
      from: 'GTA Photo Booths<hello@gtaphotobooths.ca>',
      to: ['hello@gtaphotobooths.ca'],
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: emailContent,
    });

    return res.status(200).json({ success: true, message: 'Email sent successfully', data });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
