
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    const contactEmail = process.env.CONTACT_EMAIL;

    if (!apiKey || !contactEmail) {
      console.error('Missing Brevo configuration');
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: name, email: email },
        to: [{ email: contactEmail }],
        subject: `New Contact Form Submission from ${name}`,
        textContent: message,
        htmlContent: `
          <html>
            <body>
              <h1>New Message from ${name}</h1>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Message:</strong></p>
              <p>${message}</p>
            </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Brevo API Error:", errorData);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: response.status }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing contact form:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
