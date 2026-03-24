// netlify/functions/notify-assignment.js
// Fires when a manager assigns a task — texts the employee

const twilio = require("twilio");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  const { task, employee } = JSON.parse(event.body);
  if (!employee?.phone) return { statusCode: 400, body: "No phone" };

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER,
    to:   employee.phone,
    body: `Hi ${employee.name.split(" ")[0]}! Your manager assigned you a new task: "${task.title}". Log in to ShiftCheck to view it: ${process.env.APP_URL}`,
  });

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
