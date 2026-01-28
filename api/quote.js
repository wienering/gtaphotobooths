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
    const { contact, package: packageData, addons, total } = body;

    // Validate required fields
    if (!contact || !contact.fullName || !contact.email || !contact.phone || !contact.eventDate) {
      return res.status(400).json({ error: 'Contact information is required' });
    }

    if (!packageData || !packageData.hours || !packageData.price) {
      return res.status(400).json({ error: 'Package selection is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contact.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Format the event date
    const eventDate = new Date(contact.eventDate);
    const formattedDate = eventDate.toLocaleDateString('en-CA', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Build add-ons list
    const addonsList = [];
    if (addons.unlimitedPrints) {
      // Unlimited prints scales at $60 per hour
      const unlimitedPrintsPrice = packageData.hours * 60;
      addonsList.push(`Unlimited Prints - $${unlimitedPrintsPrice}`);
    }
    if (addons.glamBooth) {
      addonsList.push('Glam Booth - $75');
    }
    if (addons.waitingTime > 0) {
      // Waiting time scales at $50 per hour
      const waitingTimePrice = addons.waitingTime * 50;
      addonsList.push(`Waiting Time (${addons.waitingTime} hours) - $${waitingTimePrice}`);
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
            border-bottom: 3px solid #0d8d9a;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
          }
          .email-header h2 {
            color: #0d8d9a;
            font-size: 1.75rem;
            margin: 0;
            font-weight: 600;
          }
          .quote-section {
            background-color: #f8f9fa;
            padding: 1.5rem;
            border-radius: 5px;
            margin-bottom: 1.5rem;
          }
          .quote-section h3 {
            color: #0d8d9a;
            font-size: 1.25rem;
            margin-top: 0;
            margin-bottom: 1rem;
          }
          .field-group {
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #ecf0f1;
          }
          .field-group:last-child {
            border-bottom: none;
          }
          .field-label {
            color: #0d8d9a;
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
          .quote-total {
            background-color: #0d8d9a;
            color: #ffffff;
            padding: 1.5rem;
            border-radius: 5px;
            text-align: center;
            margin-top: 1.5rem;
          }
          .quote-total h3 {
            margin: 0 0 0.5rem 0;
            font-size: 1.25rem;
          }
          .quote-total .total-amount {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0;
          }
          .email-footer {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            color: #666666;
            font-size: 0.875rem;
          }
          .addon-item {
            padding: 0.5rem 0;
            border-bottom: 1px solid #ecf0f1;
          }
          .addon-item:last-child {
            border-bottom: none;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h2>New Photo Booth Quote Request</h2>
          </div>
          
          <div class="quote-section">
            <h3>Client Information</h3>
            <div class="field-group">
              <span class="field-label">Name</span>
              <p class="field-value">${contact.fullName}</p>
            </div>
            <div class="field-group">
              <span class="field-label">Email</span>
              <p class="field-value"><a href="mailto:${contact.email}" style="color: #d58a6d; text-decoration: none;">${contact.email}</a></p>
            </div>
            <div class="field-group">
              <span class="field-label">Phone</span>
              <p class="field-value"><a href="tel:${contact.phone.replace(/\D/g, '')}" style="color: #d58a6d; text-decoration: none;">${contact.phone}</a></p>
            </div>
            <div class="field-group">
              <span class="field-label">Event Date</span>
              <p class="field-value">${formattedDate}</p>
            </div>
          </div>

          <div class="quote-section">
            <h3>Package Details</h3>
            <div class="field-group">
              <span class="field-label">Base Package</span>
              <p class="field-value">${packageData.hours} Hours - $${packageData.price.toLocaleString()}</p>
            </div>
            ${addonsList.length > 0 ? `
            <div class="field-group">
              <span class="field-label">Add-ons</span>
              ${addonsList.map(addon => `<div class="addon-item"><p class="field-value">${addon}</p></div>`).join('')}
            </div>
            ` : '<div class="field-group"><p class="field-value">No add-ons selected</p></div>'}
          </div>

          <div class="quote-total">
            <h3>Total Quote Amount</h3>
            <p class="total-amount">$${total.toLocaleString()}</p>
          </div>

          <div class="email-footer">
            <p>This quote was generated from the GTA Photo Booths quote tool.</p>
            <p>Reply directly to this email to respond to ${contact.fullName}.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Customer email content
    const customerEmailContent = `
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
            text-align: center;
            border-bottom: 3px solid #0d8d9a;
            padding-bottom: 1rem;
            margin-bottom: 2rem;
          }
          .email-header h2 {
            color: #0d8d9a;
            font-size: 1.75rem;
            margin: 0;
            font-weight: 600;
          }
          .quote-section {
            background-color: #f8f9fa;
            padding: 1.5rem;
            border-radius: 5px;
            margin-bottom: 1.5rem;
          }
          .quote-section h3 {
            color: #0d8d9a;
            font-size: 1.25rem;
            margin-top: 0;
            margin-bottom: 1rem;
          }
          .field-group {
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #ecf0f1;
          }
          .field-group:last-child {
            border-bottom: none;
          }
          .field-label {
            color: #0d8d9a;
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
          .quote-total {
            background-color: #0d8d9a;
            color: #ffffff;
            padding: 1.5rem;
            border-radius: 5px;
            text-align: center;
            margin-top: 1.5rem;
          }
          .quote-total h3 {
            margin: 0 0 0.5rem 0;
            font-size: 1.25rem;
          }
          .quote-total .total-amount {
            font-size: 2.5rem;
            font-weight: 700;
            margin: 0;
          }
          .cta-button {
            display: inline-block;
            background-color: #d58a6d;
            color: #ffffff;
            padding: 1rem 2rem;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            margin-top: 1.5rem;
            text-align: center;
          }
          .email-footer {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            color: #666666;
            font-size: 0.875rem;
          }
          .addon-item {
            padding: 0.5rem 0;
            border-bottom: 1px solid #ecf0f1;
          }
          .addon-item:last-child {
            border-bottom: none;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h2>Your Photo Booth Quote</h2>
          </div>
          
          <p>Hi ${contact.fullName},</p>
          
          <p>Thank you for requesting a quote from GTA Photo Booths! Below are the details of your quote:</p>

          <div class="quote-section">
            <h3>Event Details</h3>
            <div class="field-group">
              <span class="field-label">Event Date</span>
              <p class="field-value">${formattedDate}</p>
            </div>
          </div>

          <div class="quote-section">
            <h3>Package Details</h3>
            <div class="field-group">
              <span class="field-label">Base Package</span>
              <p class="field-value">${packageData.hours} Hours - $${packageData.price.toLocaleString()}</p>
            </div>
            ${addonsList.length > 0 ? `
            <div class="field-group">
              <span class="field-label">Add-ons</span>
              ${addonsList.map(addon => `<div class="addon-item"><p class="field-value">${addon}</p></div>`).join('')}
            </div>
            ` : '<div class="field-group"><p class="field-value">No add-ons selected</p></div>'}
          </div>

          <div class="quote-total">
            <h3>Total Quote Amount</h3>
            <p class="total-amount">$${total.toLocaleString()}</p>
          </div>

          <p>We're excited to help make your event unforgettable! If you have any questions or would like to customize your package, please don't hesitate to reach out to us.</p>

          <div style="text-align: center;">
            <a href="https://www.gtaphotobooths.ca/contact.html" class="cta-button">Contact Us</a>
          </div>

          <div class="email-footer">
            <p><strong>GTA Photo Booths</strong></p>
            <p>Phone: <a href="tel:+16473785332" style="color: #d58a6d; text-decoration: none;">647-378-5332</a></p>
            <p>Email: <a href="mailto:hello@gtaphotobooths.ca" style="color: #d58a6d; text-decoration: none;">hello@gtaphotobooths.ca</a></p>
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

    // Send email to business
    const businessEmail = await resend.emails.send({
      from: 'GTA Photo Booths<hello@gtaphotobooths.ca>',
      to: ['hello@gtaphotobooths.ca'],
      replyTo: contact.email,
      subject: `New Photo Booth Quote Request from ${contact.fullName}`,
      html: emailContent,
    });

    // Send email to customer
    const customerEmail = await resend.emails.send({
      from: 'GTA Photo Booths<hello@gtaphotobooths.ca>',
      to: [contact.email],
      subject: `Your Photo Booth Quote from GTA Photo Booths`,
      html: customerEmailContent,
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Quote sent successfully', 
      data: { businessEmail, customerEmail } 
    });
  } catch (error) {
    console.error('Error sending quote:', error);
    return res.status(500).json({ 
      error: 'Failed to send quote', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
