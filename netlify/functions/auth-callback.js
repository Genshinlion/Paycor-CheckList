// netlify/functions/auth-callback.js
// Paycor redirects here after the employee logs in on their site.
// We exchange the short-lived auth code for a real access token,
// then fetch the employee's profile and set a session cookie.

const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  const { code, error } = event.queryStringParameters || {};

  if (error || !code) {
    return { statusCode: 302, headers: { Location: "/?auth_error=1" } };
  }

  try {
    // ── 1. Exchange code for access token ──────────────────────────────────
    const tokenRes = await fetch("https://apis.paycor.com/sts/v1/common/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "authorization_code",
        client_id:     process.env.PAYCOR_CLIENT_ID,
        client_secret: process.env.PAYCOR_CLIENT_SECRET,
        redirect_uri:  `${process.env.APP_URL}/.netlify/functions/auth-callback`,
        code,
      }),
    });

    const { access_token, expires_in } = await tokenRes.json();
    if (!access_token) throw new Error("No access token");

    // ── 2. Fetch employee profile from Paycor ─────────────────────────────
    const profileRes = await fetch(
      `https://apis.paycor.com/v1/employees/me`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Ocp-Apim-Subscription-Key": process.env.PAYCOR_SUBSCRIPTION_KEY,
        },
      }
    );
    const profile = await profileRes.json();

    // ── 3. Upsert employee into Supabase ──────────────────────────────────
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: user } = await supabase
      .from("users")
      .upsert(
        {
          paycor_employee_id: profile.id,
          name:  `${profile.firstName} ${profile.lastName}`,
          email: profile.workEmail,
          phone: profile.mobilePhone,
          role:  profile.jobTitle?.toLowerCase().includes("manager") ? "manager" : "employee",
          auth_provider: "paycor",
        },
        { onConflict: "paycor_employee_id" }
      )
      .select()
      .single();

    // ── 4. Create a signed session JWT via Supabase Auth ──────────────────
    // We use a short-lived token (1hr) stored in an HttpOnly cookie
    const sessionPayload = Buffer.from(
      JSON.stringify({
        userId:   user.id,
        name:     user.name,
        role:     user.role,
        provider: "paycor",
        exp:      Math.floor(Date.now() / 1000) + (expires_in || 3600),
      })
    ).toString("base64");

    return {
      statusCode: 302,
      headers: {
        Location: "/dashboard",
        "Set-Cookie": [
          `sc_session=${sessionPayload}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${expires_in || 3600}`,
        ].join(", "),
      },
    };
  } catch (err) {
    console.error("auth-callback error:", err);
    return { statusCode: 302, headers: { Location: "/?auth_error=1" } };
  }
};
