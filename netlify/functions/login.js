// netlify/functions/login.js
// Handles local (backup) email + password login.
// Verifies bcrypt hash, issues session cookie.

const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400, body: "Invalid JSON" }; }

  const { email, password } = body;
  if (!email || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: "Email and password required." }) };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // ── 1. Look up user by email ───────────────────────────────────────────
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, role, password_hash, must_change_password, auth_provider")
    .eq("email", email.toLowerCase().trim())
    .eq("auth_provider", "local")
    .single();

  if (error || !user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid email or password." }),
    };
  }

  // ── 2. Compare password to stored hash ────────────────────────────────
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Invalid email or password." }),
    };
  }

  // ── 3. Build session payload ──────────────────────────────────────────
  const sessionPayload = Buffer.from(
    JSON.stringify({
      userId:             user.id,
      name:               user.name,
      role:               user.role,
      provider:           "local",
      mustChangePassword: user.must_change_password,
      exp:                Math.floor(Date.now() / 1000) + 3600,
    })
  ).toString("base64");

  return {
    statusCode: 200,
    headers: {
      "Set-Cookie": `sc_session=${sessionPayload}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ok:                 true,
      mustChangePassword: user.must_change_password,
    }),
  };
};
