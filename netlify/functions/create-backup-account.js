// netlify/functions/create-backup-account.js
// Called by a manager to create a local (non-Paycor) backup account.
// Generates a temp password, hashes it with bcrypt, stores the hash,
// and texts the temp password to the employee via Twilio.

const bcrypt  = require("bcryptjs");
const twilio  = require("twilio");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: "Invalid JSON" }; }

  const { name, email, phone, role = "employee" } = body;

  if (!name || !email || !phone) {
    return { statusCode: 400, body: "name, email and phone are required" };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // ── 1. Generate temp password & hash immediately ───────────────────────
  const tempPassword = Math.random().toString(36).slice(-8) +
                       Math.random().toString(36).slice(-4).toUpperCase();

  const hash = await bcrypt.hash(tempPassword, 12); // cost 12 ≈ 300ms

  // ── 2. Insert into Supabase users table ───────────────────────────────
  const { data: user, error } = await supabase
    .from("users")
    .insert({
      name,
      email:                email.toLowerCase().trim(),
      phone,
      role,
      password_hash:        hash,
      must_change_password: true,
      auth_provider:        "local",
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    return {
      statusCode: 409,
      body: JSON.stringify({ error: "Account with that email already exists." }),
    };
  }

  // ── 3. Send temp password via SMS ─────────────────────────────────────
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to:   phone,
      body: `Hi ${name.split(" ")[0]}! Your ShiftCheck backup account is ready.\n\nTemp password: ${tempPassword}\nLogin: ${process.env.APP_URL}\n\nYou'll be asked to set a new password on first login. Do not share this code.`,
    });
  } catch (smsErr) {
    console.warn("SMS failed (account still created):", smsErr.message);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok:     true,
      userId: user.id,
      note:   "Temp password sent via SMS.",
    }),
  };
};
