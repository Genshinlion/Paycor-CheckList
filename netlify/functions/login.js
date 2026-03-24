const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405 };

  let body;
  try { body = JSON.parse(event.body); }
  catch { return { statusCode: 400 }; }

  const { email, password } = body;
  if (!email || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: "Email and password required." }) };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  const { data, error } = await supabase
    .rpc("verify_user_password", { user_email: email.toLowerCase().trim(), user_password: password });

  if (error || !data || data.length === 0) {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid email or password." }) };
  }

  const user = data[0];

  const sessionPayload = Buffer.from(JSON.stringify({
    userId:             user.id,
    name:               user.name,
    role:               user.role,
    provider:           "local",
    mustChangePassword: user.must_change_password,
    exp:                Math.floor(Date.now() / 1000) + 3600,
  })).toString("base64");

  return {
    statusCode: 200,
    headers: {
      "Set-Cookie": `sc_session=${sessionPayload}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ok: true, mustChangePassword: user.must_change_password }),
  };
};
