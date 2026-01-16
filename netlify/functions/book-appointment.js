const { google } = require('googleapis');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { date, time, name, email, reason } = JSON.parse(event.body);

  // Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  // Set the refresh token
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

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
