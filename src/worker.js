function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
    }
  });
}

async function handleHealth(env) {
  return jsonResponse({
    ok: true,
    service: "IFA Cloudflare Worker",
    openrouter: Boolean(env.OPENROUTER_API_KEY),
    resend: Boolean(env.RESEND_API_KEY),
    adminEmail: Boolean(env.ADMIN_EMAIL),
    kv: Boolean(env.IFA_KV)
  });
}

async function handleAssistant(request, env) {
  const body = await request.json().catch(() => ({}));
  const userMessage =
    body.message ||
    body.question ||
    body.text ||
    (Array.isArray(body.messages) ? body.messages.at(-1)?.content : "");

  if (!userMessage || String(userMessage).trim().length < 1) {
    return jsonResponse({
      ok: false,
      error: "message_required",
      reply: "اكتب رسالتك أولًا وسأساعدك."
    }, 400);
  }

  if (!env.OPENROUTER_API_KEY) {
    return jsonResponse({
      ok: false,
      error: "missing_OPENROUTER_API_KEY",
      reply: "المساعد غير مفعل بعد. أضف OPENROUTER_API_KEY في Cloudflare Variables."
    }, 500);
  }

  const siteName = env.SITE_NAME || "IFA FOR PUBLIC SERVICES";
  const model = env.AI_MODEL || "openrouter/free";

  const systemPrompt = env.AI_SYSTEM_PROMPT || `
أنت مساعد خدمة عملاء رسمي لموقع ${siteName}.
تحدث بالعربية الواضحة والودية.
خدمات الشركة: القبولات الجامعية، التأشيرات، الإقامة، التأمين، الخدمات التعليمية والعامة.
اجعل الإجابات قصيرة ومباشرة، واطلب من العميل التواصل عبر واتساب عند الحاجة.
لا تخترع أسعارًا أو مواعيد نهائية غير مؤكدة.
`;

  const messages = Array.isArray(body.messages)
    ? [
        { role: "system", content: systemPrompt },
        ...body.messages.slice(-10).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || "")
        }))
      ]
    : [
        { role: "system", content: systemPrompt },
        { role: "user", content: String(userMessage) }
      ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.SITE_URL || "https://ifa-cloudflare-site.pages.dev",
      "X-Title": siteName
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      max_tokens: 700
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return jsonResponse({
      ok: false,
      error: "openrouter_error",
      status: response.status,
      details: data,
      reply: "حصل خطأ في الاتصال بالمساعد الذكي. تأكد من مفتاح OpenRouter والمتغيرات."
    }, 502);
  }

  const reply =
    data?.choices?.[0]?.message?.content ||
    data?.choices?.[0]?.text ||
    "لم أستطع تجهيز رد الآن. حاول مرة أخرى.";

  return jsonResponse({ ok: true, reply, model: data?.model || model });
}

async function handleVisitors(env) {
  if (!env.IFA_KV) {
    return jsonResponse({
      ok: true,
      count: 0,
      note: "KV غير مربوط. أضف KV binding باسم IFA_KV لتفعيل عداد الزوار الحقيقي."
    });
  }

  const key = "visitor_counter_total";
  const current = Number(await env.IFA_KV.get(key) || "0");
  const next = current + 1;
  await env.IFA_KV.put(key, String(next));
  return jsonResponse({ ok: true, count: next });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function handleContact(request, env) {
  const body = await request.json().catch(() => ({}));

  const name = body.name || body.fullName || body.full_name || "";
  const phone = body.phone || body.whatsapp || body.mobile || "";
  const email = body.email || "";
  const service = body.service || body.subject || "طلب جديد من الموقع";
  const message = body.message || body.notes || "";

  if (!name && !phone && !email && !message) {
    return jsonResponse({
      ok: false,
      error: "empty_request",
      message: "الطلب فارغ. أدخل الاسم أو رقم التواصل."
    }, 400);
  }

  const savedRequest = {
    createdAt: new Date().toISOString(),
    name,
    phone,
    email,
    service,
    message,
    source: "ifa-website"
  };

  if (env.IFA_KV) {
    const id = `request_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    await env.IFA_KV.put(id, JSON.stringify(savedRequest));
  }

  let emailSent = false;
  let emailNote = "لم يتم إرسال إيميل لأن RESEND_API_KEY أو ADMIN_EMAIL غير مضافين.";

  if (env.RESEND_API_KEY && env.ADMIN_EMAIL) {
    const fromEmail = env.FROM_EMAIL || "IFA Website <onboarding@resend.dev>";
    const subject = `طلب جديد من موقع IFA - ${service}`;

    const html = `
      <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
        <h2>طلب جديد من موقع IFA</h2>
        <p><b>الاسم:</b> ${escapeHtml(name)}</p>
        <p><b>رقم التواصل/واتساب:</b> ${escapeHtml(phone)}</p>
        <p><b>الإيميل:</b> ${escapeHtml(email)}</p>
        <p><b>الخدمة:</b> ${escapeHtml(service)}</p>
        <p><b>الرسالة:</b><br>${escapeHtml(message)}</p>
        <hr>
        <p><small>${savedRequest.createdAt}</small></p>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [env.ADMIN_EMAIL],
        subject,
        html
      })
    });

    const resendData = await resendRes.json().catch(() => ({}));
    emailSent = resendRes.ok;
    emailNote = resendRes.ok ? "تم إرسال الطلب إلى الإيميل." : `فشل إرسال الإيميل: ${JSON.stringify(resendData)}`;
  }

  return jsonResponse({
    ok: true,
    message: "تم استلام طلبك بنجاح.",
    emailSent,
    emailNote
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      if (path === "/api/health" && request.method === "GET") {
        return handleHealth(env);
      }

      if ((path === "/api/ifa-assistant" || path === "/api/chat") && request.method === "POST") {
        return handleAssistant(request, env);
      }

      if (path === "/api/visitors" && (request.method === "GET" || request.method === "POST")) {
        return handleVisitors(env);
      }

      if ((path === "/api/contact" || path === "/api/send-request") && request.method === "POST") {
        return handleContact(request, env);
      }

      // Serve static site files.
      return env.ASSETS.fetch(request);
    } catch (error) {
      return jsonResponse({
        ok: false,
        error: "server_error",
        message: error.message
      }, 500);
    }
  }
};
