const { google } = require('googleapis');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { date, time, name, email, reason } = JSON.parse(event.body);

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({ version: 'v3', auth });

  const startDateTime = new Date(`${date}T${time}:00`);
  const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

  try {
    const eventResult = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `Appointment with ${name}`,
        description: reason || 'Booked via phone',
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Chicago',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Chicago',
        },
        attendees: email ? [{ email }] : [],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        eventId: eventResult.data.id,
        eventLink: eventResult.data.htmlLink,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
