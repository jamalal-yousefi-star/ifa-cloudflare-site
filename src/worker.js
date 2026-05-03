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

async function readKnowledgeBase(request, env) {
  return `
IFA FOR PUBLIC SERVICES هي شركة خدمات عامة وتعليمية في تركيا.

المالكون:
- بدر اليوسفي
- هشام الرامسي

الشركة تساعد الطلاب والمقيمين والمسافرين في:
القبولات الجامعية، الجامعات الحكومية والخاصة، المعاهد، الإقامة، التأمين، التأشيرات، الترجمة، التصديق، تجهيز الملفات، متابعة الطلبات، والخدمات العامة.

قاعدة اللغة:
رد بنفس لغة العميل. إذا كتب عربي رد عربي، إذا كتب تركي رد تركي، إذا كتب إنجليزي رد إنجليزي. إذا خلط لغتين، استخدم اللغة الأكثر ظهورًا.

التحية:
السلام عليكم: وعليكم السلام ورحمة الله، أهلًا وسهلًا بك في IFA. كيف يمكنني مساعدتك اليوم؟
مرحبًا: أهلًا وسهلًا بك، كيف يمكنني مساعدتك؟
كيف حالك؟ الحمد لله بخير، شكرًا لسؤالك. كيف يمكنني خدمتك اليوم؟
صباح الخير: صباح النور، أهلًا بك في IFA.
مساء الخير: مساء النور، أهلًا وسهلًا بك.
شكرًا: العفو، نحن في خدمتك دائمًا.

الدراسة في تركيا:
تركيا فيها جامعات حكومية وخاصة. الدراسة قد تكون بالتركية أو الإنجليزية. القبول يختلف حسب الجامعة، التخصص، المعدل، المقاعد، الجنسية، ولغة الدراسة.

الجامعات الحكومية:
رسومها غالبًا أقل، لكن المنافسة أعلى والقبول يعتمد على المفاضلة والمعدل والمقاعد.

الجامعات الخاصة:
أسرع وأسهل غالبًا في القبول، لكن الرسوم أعلى وتختلف حسب الجامعة والتخصص.

عند طلب قبول جامعي:
اسأل عن المرحلة، التخصص، المعدل، اللغة المطلوبة، الجنسية، وهل يريد جامعة حكومية أو خاصة.

المعاهد:
IFA تساعد في معاهد اللغة التركية والإنجليزية والدورات التحضيرية حسب المدينة والمتاح.

الإقامة:
IFA تساعد في ملف الإقامة، التأمين، دفع الرسوم، ومراجعة النواقص. القرار النهائي للجهات الرسمية. لا تعطي ضمان.

التأمين:
اسأل عن العمر، نوع التأمين، المدة، وهل هو لغرض إقامة أو سفر أو دراسة.

التأشيرات:
اسأل عن الجنسية، الدولة المطلوبة، نوع التأشيرة، وتاريخ السفر.

الترجمة والتصديق:
IFA تساعد في ترجمة وتصديق الشهادات، كشف الدرجات، جواز السفر، والوثائق المطلوبة للجامعة أو الإقامة.

الحياة في تركيا:
إسطنبول كبيرة وحيوية لكنها أعلى تكلفة. أنقرة مناسبة للدراسة. سكاريا قريبة من إسطنبول وهادئة ومناسبة للطلاب. بورصة، إزمير، قونيا، قيصري، إسكي شهير، طرابزون وكوجالي خيارات جيدة حسب الجامعة والتكلفة.

السكن:
السكن قد يكون جامعي، خاص، شقة مشتركة أو مستقلة، والتكلفة تختلف حسب المدينة والقرب من الجامعة والخدمات.

العمل:
فرص العمل تختلف حسب المدينة واللغة والمهارة والوضع القانوني. لا تضمن عملًا.

ممنوع:
لا تخترع أسعارًا أو مواعيد أو ضمانات. لا تقل مضمون 100%. لا تطلب كلمات مرور أو بيانات بنكية. إذا احتاج الأمر تحقق، قل إن فريق IFA يمكنه التحقق.
`;
}

async function handleHealth(request, env) {
  const kb = await readKnowledgeBase(request, env);
  return jsonResponse({
    ok: true,
    service: "IFA Cloudflare Worker",
    openrouter: Boolean(env.OPENROUTER_API_KEY),
    model: env.AI_MODEL || "openrouter/free",
    knowledgeBase: kb.length > 100,
    knowledgeBaseCharacters: kb.length,
    internalKB: true
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
    return jsonResponse({ ok: false, error: "message_required", reply: "اكتب رسالتك أولًا وسأساعدك." }, 400);
  }

  if (!env.OPENROUTER_API_KEY) {
    return jsonResponse({ ok: false, error: "missing_OPENROUTER_API_KEY", reply: "المساعد غير مفعل بعد. أضف OPENROUTER_API_KEY في Cloudflare Variables." }, 500);
  }

  const siteName = env.SITE_NAME || "IFA FOR PUBLIC SERVICES";
  const model = env.AI_MODEL || "openrouter/free";
  const knowledgeBase = await readKnowledgeBase(request, env);

  const shortPrompt = env.AI_SYSTEM_PROMPT || "أنت مساعد IFA الذكي. رد بنفس لغة العميل. كن ودودًا ومختصرًا ومهنيًا. لا تخترع أسعارًا أو مواعيد أو ضمانات.";

  const systemPrompt = `
${shortPrompt}

استخدم قاعدة معرفة IFA التالية كأساس لإجاباتك. التزم بالمعلومات الموجودة فيها. إذا لم توجد المعلومة، لا تخترعها وقل إن فريق IFA يمكنه التحقق.

--- IFA KNOWLEDGE BASE START ---
${knowledgeBase}
--- IFA KNOWLEDGE BASE END ---
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
      "HTTP-Referer": env.SITE_URL || "https://ifa-cloudflare-site.jamal-al-yousefi.workers.dev",
      "X-Title": siteName
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.25,
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

  return jsonResponse({ ok: true, reply, model: data?.model || model, knowledgeBase: true });
}

async function handleVisitors(env) {
  return jsonResponse({ ok: true, count: 0, note: "عداد الزوار التجريبي يعمل. لعداد حقيقي اربط KV باسم IFA_KV." });
}

async function handleContact(request, env) {
  const body = await request.json().catch(() => ({}));
  return jsonResponse({
    ok: true,
    message: "تم استلام الطلب. لإرسال الطلب إلى الإيميل يجب إضافة RESEND_API_KEY و ADMIN_EMAIL.",
    received: body
  });
}

const HOME_HTML = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>IFA FOR PUBLIC SERVICES</title>
<style>
body{margin:0;background:#111827;color:white;font-family:Arial,Tahoma,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center}
.card{max-width:720px;padding:30px;border:1px solid #d4a017;border-radius:24px;background:#0f172a}
h1{color:#f6d56f}
a{color:#f6d56f}
#ifa-ai-widget *{box-sizing:border-box}
#ifa-ai-widget{position:fixed!important;right:16px!important;bottom:16px!important;z-index:999999!important;direction:rtl!important;text-align:right}
#ifa-ai-panel{display:none;width:min(360px,calc(100vw - 24px));height:min(520px,calc(100vh - 90px));background:#111827;border:1px solid rgba(245,196,94,.55);border-radius:18px;overflow:hidden;color:#fff;box-shadow:0 18px 50px rgba(0,0,0,.45)}
#ifa-ai-widget.open #ifa-ai-panel{display:flex;flex-direction:column}
#ifa-ai-header{background:linear-gradient(135deg,#f6d56f,#b8860b);color:#111;padding:12px 14px;font-weight:800;display:flex;justify-content:space-between;align-items:center}
#ifa-ai-close{border:0;background:rgba(0,0,0,.15);border-radius:10px;width:32px;height:32px;cursor:pointer}
#ifa-ai-messages{flex:1;overflow:auto;padding:12px;background:#0f172a}
.ifa-msg{max-width:88%;padding:10px 12px;margin:8px 0;border-radius:14px;line-height:1.6;font-size:14px;white-space:pre-wrap}
.ifa-bot{background:#1f2937;border:1px solid rgba(245,196,94,.35);margin-left:auto}
.ifa-user{background:#14532d;border:1px solid rgba(34,197,94,.45);margin-right:auto}
#ifa-ai-form{display:flex;gap:8px;padding:10px;background:#111827;border-top:1px solid rgba(245,196,94,.25)}
#ifa-ai-input{flex:1;border:1px solid rgba(245,196,94,.45);border-radius:12px;background:#0b1220;color:#fff;padding:11px;outline:none}
#ifa-ai-send,#ifa-ai-button{border:0;border-radius:12px;background:linear-gradient(135deg,#f6d56f,#d4a017);color:#111;font-weight:800;cursor:pointer}
#ifa-ai-send{padding:0 14px}
#ifa-ai-button{border-radius:999px;padding:12px 16px}
@media(max-width:600px){#ifa-ai-widget{right:10px!important;bottom:10px!important}#ifa-ai-panel{width:calc(100vw - 20px)!important;height:72vh!important}}
</style>
</head>
<body>
<div class="card">
<h1>IFA FOR PUBLIC SERVICES</h1>
<p>موقع IFA يعمل. المساعد الذكي متاح أسفل الصفحة.</p>
<p>اختبار النظام: <a href="/api/health">/api/health</a></p>
</div>
<div id="ifa-ai-widget">
<div id="ifa-ai-panel">
<div id="ifa-ai-header"><div>مساعد IFA الذكي</div><button id="ifa-ai-close">×</button></div>
<div id="ifa-ai-messages"></div>
<form id="ifa-ai-form"><input id="ifa-ai-input" placeholder="اكتب رسالتك هنا..."><button id="ifa-ai-send">إرسال</button></form>
</div>
<button id="ifa-ai-button">✨ مساعد IFA</button>
</div>
<script>
(function(){
function addMsg(text,who){var box=document.getElementById('ifa-ai-messages');var m=document.createElement('div');m.className='ifa-msg '+(who==='user'?'ifa-user':'ifa-bot');m.textContent=text;box.appendChild(m);box.scrollTop=box.scrollHeight;}
var wrap=document.getElementById('ifa-ai-widget');
document.getElementById('ifa-ai-button').onclick=function(){wrap.classList.add('open');};
document.getElementById('ifa-ai-close').onclick=function(){wrap.classList.remove('open');};
addMsg('مرحبًا بك في IFA FOR PUBLIC SERVICES 👋\\nأنا مساعد IFA الذكي. كيف يمكنني مساعدتك اليوم؟','bot');
document.getElementById('ifa-ai-form').onsubmit=async function(e){
 e.preventDefault();
 var inp=document.getElementById('ifa-ai-input'); var text=(inp.value||'').trim(); if(!text)return; inp.value='';
 addMsg(text,'user'); addMsg('جاري كتابة الرد...','bot');
 var box=document.getElementById('ifa-ai-messages'); var loading=box.lastChild;
 try{
  var res=await fetch('/api/ifa-assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:text})});
  var data=await res.json(); loading.textContent=data.reply||data.message||'لم يصل رد من المساعد.';
 }catch(err){loading.textContent='تعذر الاتصال بالمساعد الآن.';}
};
})();
</script>
</body></html>`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });

    try {
      if (path === "/api/health" && request.method === "GET") return handleHealth(request, env);
      if ((path === "/api/ifa-assistant" || path === "/api/chat") && request.method === "POST") return handleAssistant(request, env);
      if (path === "/api/visitors") return handleVisitors(env);
      if ((path === "/api/contact" || path === "/api/send-request") && request.method === "POST") return handleContact(request, env);
      return new Response(HOME_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    } catch (error) {
      return jsonResponse({ ok: false, error: "server_error", message: error.message }, 500);
    }
  }
};
