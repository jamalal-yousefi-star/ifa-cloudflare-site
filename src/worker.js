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

const KNOWLEDGE_BASE = `
IFA FOR PUBLIC SERVICES هي شركة خدمات عامة وتعليمية في تركيا.

المالكون:
- بدر اليوسفي
- هشام الرامسي

الشركة تساعد الطلاب والمقيمين والمسافرين في:
القبولات الجامعية، الجامعات الحكومية والخاصة، المعاهد، الإقامة، التأمين، التأشيرات، الترجمة، التصديق، تجهيز الملفات، متابعة الطلبات، والخدمات العامة.

قاعدة اللغة:
رد بنفس لغة العميل. إذا كتب عربي رد عربي. إذا كتب تركي رد تركي. إذا كتب إنجليزي رد إنجليزي.

الدراسة في تركيا:
تركيا فيها جامعات حكومية وخاصة. الدراسة قد تكون بالتركية أو الإنجليزية. القبول يختلف حسب الجامعة والتخصص والمعدل والمقاعد والجنسية ولغة الدراسة.
الجامعات الحكومية رسومها غالبًا أقل والمنافسة فيها أعلى.
الجامعات الخاصة أسرع وأسهل غالبًا في القبول، لكن رسومها أعلى وتختلف حسب الجامعة والتخصص.

الإقامة:
IFA تساعد في ملف الإقامة، التأمين، دفع الرسوم، ومتابعة النواقص. القرار النهائي للجهات الرسمية ولا يوجد ضمان 100%.

التأشيرات:
اسأل عن الجنسية، الدولة المطلوبة، نوع التأشيرة، وتاريخ السفر.

الحياة في تركيا:
إسطنبول كبيرة وحيوية وأعلى تكلفة. أنقرة مناسبة للدراسة. سكاريا قريبة من إسطنبول وهادئة ومناسبة للطلاب. بورصة، إزمير، قونيا، قيصري، إسكي شهير، طرابزون وكوجالي خيارات جيدة حسب الجامعة والتكلفة.
`;

function localFallbackReply(message) {
  const msg = String(message || "").trim().toLowerCase();

  if (!msg) return "اكتب رسالتك أولًا وسأساعدك.";
  if (msg.includes("السلام")) return "وعليكم السلام ورحمة الله، أهلًا وسهلًا بك في IFA FOR PUBLIC SERVICES. كيف يمكنني مساعدتك اليوم؟";
  if (msg.includes("مرحبا") || msg.includes("مرحباً") || msg.includes("اهلا") || msg.includes("أهلا")) return "أهلًا وسهلًا بك في IFA FOR PUBLIC SERVICES 👋\nكيف يمكنني مساعدتك اليوم؟";
  if (msg.includes("كيف حال") || msg.includes("كيفك")) return "الحمد لله بخير، شكرًا لسؤالك. كيف يمكنني خدمتك اليوم؟";
  if (msg.includes("صاحب") || msg.includes("مالك") || msg.includes("المالك") || msg.includes("owner")) return "مالكو شركة IFA FOR PUBLIC SERVICES هم بدر اليوسفي وهشام الرامسي.";
  if (msg.includes("شركة") || msg.includes("من انتم") || msg.includes("من أنتم") || msg.includes("ifa")) return "IFA FOR PUBLIC SERVICES هي شركة خدمات عامة وتعليمية في تركيا، تقدم خدمات للطلاب والمقيمين والمسافرين مثل القبولات الجامعية، الإقامة، التأمين، التأشيرات، الترجمة، التصديق، وتجهيز ومتابعة الطلبات.";
  if (msg.includes("قبول") || msg.includes("جامعة") || msg.includes("دراسة") || msg.includes("ماستر") || msg.includes("بكالوريوس")) return "نعم، نساعدك في القبولات الجامعية في تركيا للجامعات الحكومية والخاصة والمعاهد. أرسل لي المرحلة المطلوبة، التخصص، المعدل، الجنسية، لغة الدراسة، وهل تفضّل جامعة حكومية أم خاصة.";
  if (msg.includes("اقامة") || msg.includes("إقامة") || msg.includes("ikamet")) return "نساعدك في ملف الإقامة في تركيا، التأمين، دفع الرسوم، تجهيز الأوراق ومتابعة النواقص. القرار النهائي دائمًا للجهات الرسمية.";
  if (msg.includes("تأشيرة") || msg.includes("فيزا") || msg.includes("visa")) return "نساعدك في خدمات التأشيرات حسب الدولة المطلوبة. أرسل لي الجنسية، الدولة التي تريد السفر إليها، نوع التأشيرة، وتاريخ السفر المتوقع.";

  return "أقدر أساعدك في خدمات IFA مثل القبولات الجامعية، الإقامة، التأمين، التأشيرات، المعاهد، الترجمة والتصديق. اكتب طلبك بجملة قصيرة مثل: أريد قبول ماستر، أو أريد إقامة طالب.";
}

async function handleHealth(request, env) {
  return jsonResponse({
    ok: true,
    service: "IFA FOR PUBLIC SERVICES",
    mode: "original-identity-assets",
    openrouter: Boolean(env.OPENROUTER_API_KEY),
    assetsBinding: Boolean(env.ASSETS && env.ASSETS.fetch),
    assistant: true,
    duplicateAssistant: false,
    internalKnowledgeBase: true
  });
}

async function handleAssistant(request, env) {
  const body = await request.json().catch(() => ({}));
  const userMessage =
    body.message ||
    body.question ||
    body.text ||
    (Array.isArray(body.messages) ? body.messages.at(-1)?.content : "");

  if (!userMessage || !String(userMessage).trim()) {
    return jsonResponse({ ok: false, reply: "اكتب رسالتك أولًا وسأساعدك." }, 400);
  }

  if (!env.OPENROUTER_API_KEY) {
    return jsonResponse({ ok: true, mode: "local-fallback", reply: localFallbackReply(userMessage) });
  }

  const systemPrompt = `
أنت مساعد IFA FOR PUBLIC SERVICES الذكي.
رد بنفس لغة العميل.
كن ودودًا وواضحًا ومهنيًا.
لا تخترع أسعارًا أو مواعيد أو ضمانات.

قاعدة المعرفة:
${KNOWLEDGE_BASE}
`;

  const messages = Array.isArray(body.messages)
    ? [
        { role: "system", content: systemPrompt },
        ...body.messages.slice(-8).map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: String(m.content || "")
        }))
      ]
    : [
        { role: "system", content: systemPrompt },
        { role: "user", content: String(userMessage) }
      ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": env.SITE_URL || "https://ifa-cloudflare-site.jamal-al-yousefi.workers.dev",
        "X-Title": "IFA FOR PUBLIC SERVICES"
      },
      body: JSON.stringify({
        model: env.AI_MODEL || "openrouter/auto",
        messages,
        temperature: 0.25,
        max_tokens: 700
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return jsonResponse({
        ok: true,
        mode: "local-fallback-after-openrouter-error",
        openrouterStatus: response.status,
        reply: localFallbackReply(userMessage)
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      localFallbackReply(userMessage);

    return jsonResponse({ ok: true, mode: "openrouter", reply });
  } catch (error) {
    return jsonResponse({ ok: true, mode: "local-fallback-after-network-error", reply: localFallbackReply(userMessage) });
  }
}

async function serveStatic(request, env) {
  if (env.ASSETS && env.ASSETS.fetch) {
    return env.ASSETS.fetch(request);
  }
  return new Response("ASSETS binding is missing. Check wrangler.toml.", {
    status: 500,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (path === "/api/health" && request.method === "GET") return handleHealth(request, env);
    if ((path === "/api/ifa-assistant" || path === "/api/chat") && request.method === "POST") return handleAssistant(request, env);

    return serveStatic(request, env);
  }
};
