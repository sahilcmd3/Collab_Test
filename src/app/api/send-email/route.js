import { NextResponse } from "next/server";
import { EmailClient, EmailMessage, EmailAddress } from "@azure/communication-email";

export async function POST(req) {
  try {
    const { email, code } = await req.json(); // Get email and code from request

    const emailClient = new EmailClient(process.env.AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING);

    const senderEmail = process.env.EMAIL_USER;

    const message = {
      senderAddress: senderEmail,
      content: {
        subject: 'SynapseCode | Verification Code',
        plainText: `Hello, Coder! Your verification code for SynapseCode is: ${code}. Please enter this code on the website to verify your email. Thank you!`,
        html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verification Code</title>
          </head>
          <body style="font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Hello, Coder!</h2>
              <p>Your verification code for SynapseCode is:</p>
              <h3 style="color: green;">${code}</h3>
              <p>Please enter this code on the website to verify your email.</p>
              <p>Thank you!</p>
              <p style="font-size: 12px; color: gray;">
                Stealthify | Your Company Address | <a href="mailto:${senderEmail}">Contact Support</a>
              </p>
              <p style="font-size: 12px; color: gray;">If you didn’t request this, please ignore this email.</p>
            </div>
          </body>
        </html>
        `,
      },
      recipients: {
        to: [new EmailAddress(email)],
      },
    };

    const result = await emailClient.send(message);

    if (result.status !== "Succeeded") {
      return NextResponse.json({ success: false, message: "Verification email not sent!" });
    }

    return NextResponse.json({ success: true, message: "Verification email sent!" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}