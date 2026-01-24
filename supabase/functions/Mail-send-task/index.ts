import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface Payload {
  to: string;
  employeeName: string;
  assignedBy?: string;
  taskTitle: string;
  start_date: string;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  description?: string | null;
}

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const FROM = Deno.env.get("FROM_EMAIL") || "";
const FROM_NAME = Deno.env.get("FROM_NAME") || "Gestor de Trabajo";
const REPLY_TO_EMAIL = Deno.env.get("REPLY_TO_EMAIL") || FROM;
const REPLY_TO_NAME = Deno.env.get("REPLY_TO_NAME") || "Soporte Gestor de Trabajo";
const APP_URL = Deno.env.get("APP_URL") || "https://gestor-trabajo.example";
const COMPANY_ADDRESS = Deno.env.get("COMPANY_ADDRESS") || "Tu Empresa · Dirección · Ciudad · País";
const LIST_UNSUBSCRIBE_EMAIL = Deno.env.get("LIST_UNSUBSCRIBE_EMAIL") || "";

function buildEmail(payload: Payload) {
  const {
    employeeName,
    assignedBy,
    taskTitle,
    start_date,
    end_date,
    start_time,
    end_time,
    location,
    description
  } = payload;

  const fixedEmployee = (employeeName || "").trim() || "Equipo";
  const fixedAssignedBy = (assignedBy || "").trim() || "Administrador";
  const fixedTaskTitle = (taskTitle || "").trim() || "Nueva tarea";
  const fixedLocation = (location || "").trim() || "Sin localización";
  const fixedDescription = (description || "").trim();
  const dateRange = end_date && end_date !== start_date ? `${start_date} a ${end_date}` : start_date;
  const timeRange = start_time && end_time ? `${start_time} - ${end_time}` : start_time || end_time || "Horario no definido";

  const subject = `[Gestor de Trabajo] Nueva tarea asignada`;

  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; color: #111827; margin: 0; padding: 0; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%); color: #fff; padding: 32px 28px; }
        .title { margin: 0; font-size: 22px; font-weight: 700; }
        .content { padding: 28px; }
        .section { background: #f3f4f6; border-radius: 10px; padding: 18px; margin-top: 18px; border-left: 4px solid #6366f1; }
        .label { font-weight: 600; color: #4b5563; min-width: 110px; display: inline-block; }
        .value { color: #111827; }
        .footer { padding: 18px 28px 26px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p class="title">Nueva tarea asignada</p>
          <p style="margin: 6px 0 0; opacity: 0.95">${fixedAssignedBy} te ha asignado una tarea</p>
        </div>
        <div class="content">
          <p style="margin: 0 0 14px; font-size: 16px;">Hola <strong>${fixedEmployee}</strong>,</p>
          <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">Se te ha asignado una nueva tarea en el calendario. Estos son los detalles:</p>
          <div class="section">
            <div style="margin-bottom: 10px;"><span class="label">Tarea:</span><span class="value">${fixedTaskTitle}</span></div>
            <div style="margin-bottom: 10px;"><span class="label">Fecha:</span><span class="value">${dateRange}</span></div>
            <div style="margin-bottom: 10px;"><span class="label">Horario:</span><span class="value">${timeRange}</span></div>
            <div style="margin-bottom: 10px;"><span class="label">Lugar:</span><span class="value">${fixedLocation}</span></div>
            <div><span class="label">Asignado por:</span><span class="value">${fixedAssignedBy}</span></div>
          </div>
          ${fixedDescription ? `<div class="section" style="background:#fff7ed;border-left-color:#f97316;">
            <div style="margin-bottom:8px;font-weight:600;color:#9a3412;">Motivo / Detalles</div>
            <div style="color:#7c2d12;white-space:pre-wrap;">${fixedDescription}</div>
          </div>` : ""}
          <p style="margin: 18px 0 0; color: #374151; line-height: 1.6;">Por favor revisa el calendario para más información o coordinar cambios si son necesarios.</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">Este correo fue enviado automáticamente por Gestor de Trabajo.</p>
          ${COMPANY_ADDRESS ? `<p style="margin: 6px 0 0;">${COMPANY_ADDRESS}</p>` : ""}
          ${APP_URL ? `<p style="margin: 6px 0 0;">Accede a tu cuenta en ${APP_URL}</p>` : ""}
        </div>
      </div>
    </body>
  </html>`;

  const text = `Hola ${fixedEmployee},\n\nTienes una nueva tarea asignada.\n\nTarea: ${fixedTaskTitle}\nFecha: ${dateRange}\nHorario: ${timeRange}\nLugar: ${fixedLocation}\nAsignado por: ${fixedAssignedBy}${fixedDescription ? `\n\nMotivo/Detalles:\n${fixedDescription}` : ''}\n\nRevisa el calendario para más detalles.`;

  return { subject, html, text };
}

async function sendWithSendGrid(
  to: string,
  subject: string,
  html: string,
  text?: string,
  toName?: string,
  categories?: string[]
): Promise<{ status: number; body: string }> {
  if (!SENDGRID_API_KEY) {
    const error = "Missing SENDGRID_API_KEY";
    console.error('[Mail-send-task]', error);
    return { status: 500, body: JSON.stringify({ error }) };
  }

  if (!FROM) {
    const error = "Missing FROM_EMAIL (verifica Single Sender en SendGrid o usa dominio autenticado)";
    console.error('[Mail-send-task]', error);
    return { status: 500, body: JSON.stringify({ error }) };
  }

  try {
    const listUnsubLink = `${APP_URL}/notifications`;
    const listUnsubHeader = (APP_URL || LIST_UNSUBSCRIBE_EMAIL)
      ? [
          LIST_UNSUBSCRIBE_EMAIL ? `mailto:${LIST_UNSUBSCRIBE_EMAIL}` : null,
          APP_URL ? `${listUnsubLink}` : null
        ].filter(Boolean).map(v => `<${v}>`).join(', ')
      : undefined;

    const requestBody: Record<string, unknown> = {
      personalizations: [
        {
          to: [{ email: to, name: toName?.trim() || undefined }],
          subject: subject,
        },
      ],
      from: { email: FROM, name: FROM_NAME },
      reply_to: { email: REPLY_TO_EMAIL, name: REPLY_TO_NAME },
      headers: listUnsubHeader ? { 'List-Unsubscribe': listUnsubHeader } : undefined,
      tracking_settings: {
        click_tracking: { enable: false, enable_text: false },
        open_tracking: { enable: true },
        subscription_tracking: { enable: false },
      },
      categories: categories && categories.length ? categories.slice(0, 10) : [ 'task-assignment' ],
      content: [
        ...(text ? [{ type: "text/plain", value: text }] : []),
        { type: "text/html", value: html }
      ],
    };

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const body = await res.text();
    return { status: res.status, body };
  } catch (e) {
    const errorMsg = String(e);
    console.error('[Mail-send-task] Error al enviar con SendGrid:', errorMsg);
    return { status: 500, body: JSON.stringify({ error: errorMsg }) };
  }
}

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as Payload;

    if (!payload?.to?.trim() || !payload?.employeeName?.trim() || !payload?.taskTitle?.trim() || !payload?.start_date?.trim()) {
      const missing: string[] = [];
      if (!payload?.to?.trim()) missing.push('to');
      if (!payload?.employeeName?.trim()) missing.push('employeeName');
      if (!payload?.taskTitle?.trim()) missing.push('taskTitle');
      if (!payload?.start_date?.trim()) missing.push('start_date');

      return new Response(JSON.stringify({ error: "Invalid payload", missing }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { subject, html, text } = buildEmail(payload);
    const resp = await sendWithSendGrid(
      payload.to,
      subject,
      html,
      text,
      payload.employeeName,
      [ 'task-assignment' ]
    );

    if (resp.status === 202) {
      return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    return new Response(resp.body, {
      status: resp.status,
      headers: corsHeaders,
    });
  } catch (e) {
    console.error('[Mail-send-task] Error:', String(e));
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
