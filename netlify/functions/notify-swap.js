// netlify/functions/notify-swap.js
// Sends SMS to: employee receiving the task, employee giving it away, and manager

const twilio = require("twilio");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  const { swap, task, currentUser } = JSON.parse(event.body);
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const FROM   = process.env.TWILIO_PHONE_NUMBER;
  const APP    = process.env.APP_URL;

  const sends = [];

  // 1. Notify the employee RECEIVING the task
  if (swap.toPhone) {
    sends.push(client.messages.create({
      from: FROM, to: swap.toPhone,
      body: `Hi! A task has been swapped to you: "${task.title}". Please complete it before your shift ends: ${APP}`,
    }));
  }

  // 2. Confirm to the employee WHO gave away the task
  if (currentUser?.phone) {
    sends.push(client.messages.create({
      from: FROM, to: currentUser.phone,
      body: `✓ Your task swap for "${task.title}" was approved and reassigned. Manager has been notified.`,
    }));
  }

  // 3. Notify manager
  if (process.env.MANAGER_PHONE) {
    sends.push(client.messages.create({
      from: FROM, to: process.env.MANAGER_PHONE,
      body: `[ShiftCheck] Task swap: "${task.title}" was swapped from ${currentUser?.name} to another employee. Reason: ${swap.reason || "none given"}.`,
    }));
  }

  await Promise.allSettled(sends);
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
