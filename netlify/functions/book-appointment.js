const { google } = require('googleapis');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { date, time, name, email, reason } = JSON.parse(event.body);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Create start and end times using the date and time directly (no Date parsing)
  const startDateTime = `${date}T${time}:00`;
  const endHour = (parseInt(time.split(':')[0]) + 1).toString().padStart(2, '0');
  const endMinutes = time.split(':')[1];
  const endDateTime = `${date}T${endHour}:${endMinutes}:00`;

  try {
    const eventResult = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `Appointment with ${name}`,
        description: reason || 'Booked via phone',
        start: {
          dateTime: startDateTime,
          timeZone: 'America/Chicago',
        },
        end: {
          dateTime: endDateTime,
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
