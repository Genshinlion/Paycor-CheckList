// netlify/functions/change-password.js
// Called when must_change_password === true.
// Validates the new password, hashes it, clears the flag.

const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400 }; }

  const { userId, newPassword } = body;

  if (!newPassword || newPassword.length < 8) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Password must be at least 8 characters." }),
    };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const hash = await bcrypt.hash(newPassword, 12);

  const { error } = await supabase
    .from("users")
    .update({ password_hash: hash, must_change_password: false })
    .eq("id", userId);

  if (error) return { statusCode: 500, body: "DB error" };

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
