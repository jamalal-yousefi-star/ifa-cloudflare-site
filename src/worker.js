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
    model: env.AI_MODEL || "openrouter/free",
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
خدمات الشركة: القبولات الجامعية، التأشيرات، الإقامة، التأمين، الخدمات التعليمية والعامة، دفع رسوم الإقامة، التأمين الصحي، القبولات الجامعية، التأشيرات، والمتابعة.
اجعل الإجابات قصيرة ومباشرة.
إذا طلب العميل متابعة طلب أو خدمة فعلية، اطلب منه التواصل عبر واتساب.
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
      "HTTP-Referer": env.SITE_URL || "https://ifa-cloudflare-site.jamal-al-yousefi.workers.dev",
      "X-Title": siteName
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.35,
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

  const name = body.name || body.fullName || body.full_name || body["الاسم"] || "";
  const phone = body.phone || body.whatsapp || body.mobile || body["رقم الهاتف"] || "";
  const email = body.email || "";
  const service = body.service || body.subject || body["نوع الخدمة"] || "طلب جديد من الموقع";
  const message = body.message || body.notes || body["ملاحظات"] || "";

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
    message: emailSent ? "تم إرسال الطلب بنجاح." : "تم استلام الطلب، لكن الإيميل غير مفعل بعد.",
    emailSent,
    emailNote
  });
}

const injectedScript = `
<style>
  #ifa-ai-widget *{box-sizing:border-box}
  #ifa-ai-widget{position:fixed!important;right:16px!important;bottom:16px!important;z-index:2147483647!important;font-family:Arial,Tahoma,sans-serif!important;direction:rtl!important}
  #ifa-ai-panel{display:none;width:min(360px,calc(100vw - 24px));height:min(520px,calc(100vh - 90px));background:#111827;border:1px solid rgba(245,196,94,.55);border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.45);overflow:hidden;color:#fff}
  #ifa-ai-widget.open #ifa-ai-panel{display:flex;flex-direction:column}
  #ifa-ai-header{background:linear-gradient(135deg,#f6d56f,#b8860b);color:#111;padding:12px 14px;font-weight:800;display:flex;align-items:center;justify-content:space-between}
  #ifa-ai-close{border:0;background:rgba(0,0,0,.15);border-radius:10px;width:32px;height:32px;font-size:18px;cursor:pointer}
  #ifa-ai-messages{flex:1;overflow:auto;padding:12px;background:#0f172a;scroll-behavior:smooth}
  .ifa-msg{max-width:88%;padding:10px 12px;margin:8px 0;border-radius:14px;line-height:1.6;font-size:14px;white-space:pre-wrap}
  .ifa-bot{background:#1f2937;border:1px solid rgba(245,196,94,.35);margin-left:auto}
  .ifa-user{background:#14532d;border:1px solid rgba(34,197,94,.45);margin-right:auto}
  #ifa-ai-form{display:flex;gap:8px;padding:10px;background:#111827;border-top:1px solid rgba(245,196,94,.25)}
  #ifa-ai-input{flex:1;min-width:0;border:1px solid rgba(245,196,94,.45);border-radius:12px;background:#0b1220;color:#fff;padding:11px;outline:none;font-size:14px}
  #ifa-ai-send{border:0;border-radius:12px;background:linear-gradient(135deg,#f6d56f,#d4a017);color:#111;font-weight:800;padding:0 14px;cursor:pointer}
  #ifa-ai-button{border:0;border-radius:999px;background:linear-gradient(135deg,#f6d56f,#d4a017);color:#111;font-weight:800;padding:12px 16px;box-shadow:0 10px 30px rgba(0,0,0,.35);cursor:pointer;display:flex;gap:8px;align-items:center}
  #ifa-ai-button span{font-size:13px;opacity:.85}
  @media (max-width:600px){
    #ifa-ai-widget{right:10px!important;bottom:10px!important}
    #ifa-ai-panel{width:calc(100vw - 20px)!important;height:72vh!important;border-radius:16px}
    #ifa-ai-button{padding:11px 13px;font-size:13px}
    #ifa-ai-button span{display:none}
  }
</style>
<script>
(function(){
  if(window.__IFA_AI_WIDGET_READY__) return;
  window.__IFA_AI_WIDGET_READY__ = true;

  function el(tag, attrs, html){
    var n=document.createElement(tag);
    if(attrs) Object.keys(attrs).forEach(function(k){ n.setAttribute(k, attrs[k]); });
    if(html!==undefined) n.innerHTML=html;
    return n;
  }

  function addMsg(text, who){
    var box=document.getElementById('ifa-ai-messages');
    if(!box) return;
    var m=el('div',{class:'ifa-msg '+(who==='user'?'ifa-user':'ifa-bot')});
    m.textContent=text;
    box.appendChild(m);
    box.scrollTop=box.scrollHeight;
  }

  async function askAI(text){
    addMsg(text,'user');
    addMsg('جاري كتابة الرد...', 'bot');
    var box=document.getElementById('ifa-ai-messages');
    var loading=box.lastChild;
    try{
      var res=await fetch('/api/ifa-assistant',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message:text})
      });
      var data=await res.json();
      loading.textContent = data.reply || data.message || 'لم يصل رد من المساعد. جرّب مرة أخرى.';
    }catch(e){
      loading.textContent='تعذر الاتصال بالمساعد الآن. تأكد من ربط OPENROUTER_API_KEY.';
    }
    box.scrollTop=box.scrollHeight;
  }

  function createWidget(){
    if(document.getElementById('ifa-ai-widget')) return;
    var wrap=el('div',{id:'ifa-ai-widget'});
    wrap.innerHTML =
      '<div id="ifa-ai-panel">'+
        '<div id="ifa-ai-header"><div>مساعد IFA الذكي</div><button id="ifa-ai-close" type="button">×</button></div>'+
        '<div id="ifa-ai-messages"></div>'+
        '<form id="ifa-ai-form"><input id="ifa-ai-input" autocomplete="off" placeholder="اكتب رسالتك هنا..." /><button id="ifa-ai-send" type="submit">إرسال</button></form>'+
      '</div>'+
      '<button id="ifa-ai-button" type="button">✨ مساعد IFA <span>اسألني الآن</span></button>';
    document.body.appendChild(wrap);

    document.getElementById('ifa-ai-button').onclick=function(){
      wrap.classList.add('open');
      setTimeout(function(){
        var inp=document.getElementById('ifa-ai-input');
        if(inp) inp.focus();
      },50);
    };
    document.getElementById('ifa-ai-close').onclick=function(){ wrap.classList.remove('open'); };
    document.getElementById('ifa-ai-form').onsubmit=function(e){
      e.preventDefault();
      var inp=document.getElementById('ifa-ai-input');
      var text=(inp.value||'').trim();
      if(!text) return;
      inp.value='';
      askAI(text);
    };

    addMsg('مرحبًا بك في IFA للخدمات العامة 👋\\nكيف يمكنني مساعدتك؟ يمكنك السؤال عن التأشيرات، الإقامة، التأمين، القبولات الجامعية أو متابعة الطلبات.', 'bot');

    if(window.innerWidth <= 600){
      // يبقى ثابت أسفل الجوال ولا يقفز للأعلى.
      wrap.style.position='fixed';
      wrap.style.bottom='10px';
      wrap.style.right='10px';
    }
  }

  function enhanceForms(){
    document.querySelectorAll('form').forEach(function(form){
      if(form.__ifaBound) return;
      form.__ifaBound=true;
      form.addEventListener('submit', async function(e){
        var submitText=(document.activeElement && document.activeElement.textContent || '').trim();
        var looksLikeContact = /طلب|إرسال|ارسال|submit|send/i.test(submitText) || form.querySelector('input,textarea,select');
        if(!looksLikeContact) return;
        e.preventDefault();
        var payload={};
        new FormData(form).forEach(function(v,k){ payload[k]=v; });
        form.querySelectorAll('input,textarea,select').forEach(function(x){
          var key=x.name || x.id || x.placeholder || x.getAttribute('aria-label') || 'field';
          if(x.value && !payload[key]) payload[key]=x.value;
        });
        try{
          var res=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
          var data=await res.json();
          alert(data.message || 'تم استلام طلبك.');
        }catch(err){
          alert('تعذر إرسال الطلب حاليًا. يرجى التواصل عبر واتساب.');
        }
      }, true);
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    createWidget();
    enhanceForms();
    fetch('/api/visitors').catch(function(){});
  });
})();
</script>
`;

class InjectHead {
  element(element) {
    element.append(injectedScript, { html: true });
  }
}

async function serveAsset(request, env) {
  const res = await env.ASSETS.fetch(request);
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    return new HTMLRewriter().on("head", new InjectHead()).transform(res);
  }
  return res;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      if (path === "/api/health" && request.method === "GET") return handleHealth(env);
      if ((path === "/api/ifa-assistant" || path === "/api/chat") && request.method === "POST") return handleAssistant(request, env);
      if (path === "/api/visitors" && (request.method === "GET" || request.method === "POST")) return handleVisitors(env);
      if ((path === "/api/contact" || path === "/api/send-request") && request.method === "POST") return handleContact(request, env);

      return serveAsset(request, env);
    } catch (error) {
      return jsonResponse({ ok: false, error: "server_error", message: error.message }, 500);
    }
  }
};
