// netlify/functions/logout.js
exports.handler = async () => ({
  statusCode: 302,
  headers: {
    Location: "/",
    "Set-Cookie": "sc_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
  },
});
