// src/app/api/send-sms/route.js
import { NextResponse } from 'next/server';
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

export async function POST(request) {
  try {
    const { to, body } = await request.json();

    if (!to || !body) {
      return NextResponse.json(
        { error: 'Missing "to" or "body" parameters' },
        { status: 400 }
      );
    }

    const message = await client.messages.create({
      body,
      from: twilioPhone,
      to,
    });

    return NextResponse.json({ success: true, sid: message.sid });
  } catch (error) {
    console.error('Twilio SMS Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
