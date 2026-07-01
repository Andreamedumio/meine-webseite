function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try {
    data = await request.json();
  } catch (err) {
    return jsonResponse({ success: false, error: "Invalid JSON body" }, 400);
  }

  const name = (data.name ?? data.vorname ?? "").toString().trim();
  const email = (data.email ?? "").toString().trim();

  if (!name || !email) {
    return jsonResponse({ success: false, error: "name and email are required" }, 400);
  }

  if (!isValidEmail(email)) {
    return jsonResponse({ success: false, error: "invalid email" }, 400);
  }

  if (env.LEAD_WEBHOOK_URL) {
    try {
      await fetch(env.LEAD_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, receivedAt: new Date().toISOString() }),
      });
    } catch (err) {
      console.error("Failed to forward lead to webhook:", err);
    }
  }

  return jsonResponse({ success: true });
}
