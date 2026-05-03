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
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() }
  });
}

const KNOWLEDGE_BASE = `
IFA FOR PUBLIC SERVICES هي شركة خدمات عامة وتعليمية في تركيا.
المالكون: بدر اليوسفي وهشام الرامسي.
الخدمات: القبولات الجامعية في تركيا، الجامعات الحكومية والخاصة، المعاهد، الإقامة، التأمين، التأشيرات، الترجمة، التصديق، تجهيز الملفات، متابعة الطلبات، والخدمات العامة.
رد بنفس لغة العميل. لا تخترع أسعارًا أو مواعيد أو ضمانات.
`;

function localFallbackReply(message) {
  const msg = String(message || "").trim().toLowerCase();
  if (!msg) return "اكتب رسالتك أولًا وسأساعدك.";
  if (msg.includes("السلام")) return "وعليكم السلام ورحمة الله، أهلًا وسهلًا بك في IFA FOR PUBLIC SERVICES. كيف يمكنني مساعدتك اليوم؟";
  if (msg.includes("hello") || msg.includes("hi")) return "Hello, welcome to IFA FOR PUBLIC SERVICES. How can I help you today?";
  if (msg.includes("merhaba") || msg.includes("selam")) return "Merhaba, IFA FOR PUBLIC SERVICES’e hoş geldiniz. Size nasıl yardımcı olabilirim?";
  if (msg.includes("صاحب") || msg.includes("مالك") || msg.includes("المالك") || msg.includes("owner") || msg.includes("sahibi")) return "مالكو شركة IFA FOR PUBLIC SERVICES هم بدر اليوسفي وهشام الرامسي.";
  if (msg.includes("قبول") || msg.includes("جامعة") || msg.includes("دراسة") || msg.includes("ماستر") || msg.includes("university") || msg.includes("kabul")) return "نعم، نساعدك في القبولات الجامعية في تركيا للجامعات الحكومية والخاصة والمعاهد. أرسل لي المرحلة المطلوبة، التخصص، المعدل، الجنسية، ولغة الدراسة.";
  if (msg.includes("اقامة") || msg.includes("إقامة") || msg.includes("ikamet") || msg.includes("residence")) return "نساعدك في ملف الإقامة في تركيا، التأمين، دفع الرسوم، تجهيز الأوراق ومتابعة النواقص. القرار النهائي دائمًا للجهات الرسمية.";
  if (msg.includes("فيزا") || msg.includes("تأشيرة") || msg.includes("visa")) return "نساعدك في خدمات التأشيرات حسب الدولة المطلوبة. أرسل لي الجنسية، الدولة المطلوبة، نوع التأشيرة، وتاريخ السفر المتوقع.";
  return "أقدر أساعدك في خدمات IFA مثل القبولات الجامعية، الإقامة، التأمين، التأشيرات، المعاهد، الترجمة والتصديق. اكتب طلبك بجملة قصيرة وسأوجهك خطوة بخطوة.";
}

async function handleHealth(request, env) {
  return jsonResponse({
    ok: true,
    service: "IFA FOR PUBLIC SERVICES",
    version: "final-complete-rebuild",
    openrouter: Boolean(env.OPENROUTER_API_KEY),
    assetsBinding: Boolean(env.ASSETS && env.ASSETS.fetch),
    assistant: true,
    contact: true,
    visitors: true,
    duplicateAssistant: false
  });
}

async function handleAssistant(request, env) {
  const body = await request.json().catch(() => ({}));
  const userMessage = body.message || body.question || body.text || (Array.isArray(body.messages) ? body.messages.at(-1)?.content : "");

  if (!userMessage || !String(userMessage).trim()) return jsonResponse({ ok: false, reply: "اكتب رسالتك أولًا وسأساعدك." }, 400);

  if (!env.OPENROUTER_API_KEY) return jsonResponse({ ok: true, mode: "local-fallback", reply: localFallbackReply(userMessage) });

  const systemPrompt = `أنت مساعد IFA FOR PUBLIC SERVICES الذكي. رد بنفس لغة العميل. كن ودودًا ومهنيًا. لا تخترع أسعارًا أو مواعيد أو ضمانات.\n\n${KNOWLEDGE_BASE}`;
  const messages = Array.isArray(body.messages)
    ? [{ role: "system", content: systemPrompt }, ...body.messages.slice(-8).map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "") }))]
    : [{ role: "system", content: systemPrompt }, { role: "user", content: String(userMessage) }];

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.SITE_URL || "https://ifa-cloudflare-site.jamal-al-yousefi.workers.dev",
        "X-Title": "IFA FOR PUBLIC SERVICES"
      },
      body: JSON.stringify({ model: env.AI_MODEL || "openrouter/auto", messages, temperature: 0.25, max_tokens: 700 })
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return jsonResponse({ ok: true, mode: "local-fallback-after-openrouter-error", reply: localFallbackReply(userMessage) });
    const reply = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || localFallbackReply(userMessage);
    return jsonResponse({ ok: true, mode: "openrouter", reply });
  } catch (e) {
    return jsonResponse({ ok: true, mode: "local-fallback-after-network-error", reply: localFallbackReply(userMessage) });
  }
}

async function handleVisitors(env) {
  if (!env.IFA_KV) return jsonResponse({ ok: true, count: 201, mode: "static-counter" });
  const key = "visitors_total";
  const current = Number(await env.IFA_KV.get(key) || "200");
  const next = current + 1;
  await env.IFA_KV.put(key, String(next));
  return jsonResponse({ ok: true, count: next, mode: "kv-counter" });
}

async function handleContact(request, env) {
  const body = await request.json().catch(() => ({}));
  const requestData = {
    createdAt: new Date().toISOString(),
    name: body.name || "",
    phone: body.phone || "",
    service: body.service || "",
    message: body.message || "",
    source: "ifa-website"
  };

  if (env.IFA_KV) {
    await env.IFA_KV.put(`request_${Date.now()}_${Math.random().toString(36).slice(2)}`, JSON.stringify(requestData));
  }

  let emailSent = false;
  if (env.RESEND_API_KEY && env.ADMIN_EMAIL) {
    try {
      const html = `
        <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.8">
          <h2>طلب جديد من موقع IFA</h2>
          <p><b>الاسم:</b> ${escapeHtml(requestData.name)}</p>
          <p><b>واتساب:</b> ${escapeHtml(requestData.phone)}</p>
          <p><b>الخدمة:</b> ${escapeHtml(requestData.service)}</p>
          <p><b>الرسالة:</b><br>${escapeHtml(requestData.message)}</p>
          <p><small>${requestData.createdAt}</small></p>
        </div>`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: env.FROM_EMAIL || "IFA Website <onboarding@resend.dev>",
          to: [env.ADMIN_EMAIL],
          subject: `طلب جديد من موقع IFA - ${requestData.service || "بدون تحديد"}`,
          html
        })
      });
      emailSent = res.ok;
    } catch (e) { emailSent = false; }
  }

  return jsonResponse({ ok: true, message: "تم استلام الطلب", emailSent, saved: Boolean(env.IFA_KV) });
}

function escapeHtml(v) {
  return String(v || "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}

async function serveStatic(request, env) {
  if (env.ASSETS && env.ASSETS.fetch) return env.ASSETS.fetch(request);
  return new Response("ASSETS binding is missing. Check wrangler.toml.", { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
    if (path === "/api/health" && request.method === "GET") return handleHealth(request, env);
    if ((path === "/api/ifa-assistant" || path === "/api/chat") && request.method === "POST") return handleAssistant(request, env);
    if (path === "/api/visitors" && (request.method === "GET" || request.method === "POST")) return handleVisitors(env);
    if ((path === "/api/contact" || path === "/api/send-request") && request.method === "POST") return handleContact(request, env);

    return serveStatic(request, env);
  }
};
