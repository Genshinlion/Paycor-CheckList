// netlify/functions/auth-start.js
// Redirects the browser to Paycor's OAuth login page

exports.handler = async () => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id:     process.env.PAYCOR_CLIENT_ID,
    redirect_uri:  `${process.env.APP_URL}/.netlify/functions/auth-callback`,
    scope:         "openid profile employee:read schedule:read",
    state:         Math.random().toString(36).slice(2), // CSRF protection
  });

  return {
    statusCode: 302,
    headers: {
      Location: `https://apis.paycor.com/sts/v1/common/authorize?${params}`,
    },
  };
};
