// netlify/functions/shift-reminder.js
// Cron: every 15 mins — checks Paycor for shifts ending in ~30 mins, sends SMS

const twilio = require("twilio");

async function getPaycorToken() {
  const res = await fetch("https://apis.paycor.com/sts/v1/common/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "client_credentials",
      client_id:     process.env.PAYCOR_CLIENT_ID,
      client_secret: process.env.PAYCOR_CLIENT_SECRET,
      scope:         "openid",
    }),
  });
  return (await res.json()).access_token;
}

async function getShiftsEndingSoon(token) {
  const today = new Date().toISOString().split("T")[0];
  const res = await fetch(
    `https://apis.paycor.com/v1/legalEntities/${process.env.PAYCOR_LEGAL_ENTITY_ID}/schedules?startDate=${today}&endDate=${today}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Ocp-Apim-Subscription-Key": process.env.PAYCOR_SUBSCRIPTION_KEY,
      },
    }
  );
  return (await res.json()).records || [];
}

exports.handler = async () => {
  try {
    const token  = await getPaycorToken();
    const shifts = await getShiftsEndingSoon(token);
    const now    = new Date();
    const winS   = new Date(now.getTime() + 25 * 60000);
    const winE   = new Date(now.getTime() + 35 * 60000);

    const ending = shifts.filter(s => {
      const end = new Date(s.endTime);
      return end >= winS && end <= winE;
    });

    if (!ending.length) return { statusCode: 200, body: "None ending soon" };

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    await Promise.allSettled(ending.map(shift => {
      const name  = shift.employee?.firstName || "there";
      const phone = shift.employee?.mobilePhone;
      if (!phone) return Promise.resolve();
      return client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER, to: phone,
        body: `Hi ${name}! ⏰ Your shift ends in 30 mins. Please complete your tasks before clocking out: ${process.env.APP_URL}`,
      });
    }));

    return { statusCode: 200, body: JSON.stringify({ sent: ending.length }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: "Error" };
  }
};
