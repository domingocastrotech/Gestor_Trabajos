import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

interface Payload {
  to: string;
  status: "approved" | "rejected";
  type: "vacation" | "day-off";
  employeeName: string;
  start_date: string;
  end_date?: string;
  comment?: string;
  decidedByName?: string;
}

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
// FROM_EMAIL debe ser un remitente verificado (Single Sender o dominio autenticado)
const FROM = Deno.env.get("FROM_EMAIL") || "";
const FROM_NAME = Deno.env.get("FROM_NAME") || "Gestor de Trabajo";
const REPLY_TO_EMAIL = Deno.env.get("REPLY_TO_EMAIL") || FROM;
const REPLY_TO_NAME = Deno.env.get("REPLY_TO_NAME") || "Soporte Gestor de Trabajo";
const APP_URL = Deno.env.get("APP_URL") || "https://gestor-trabajo.example";
const COMPANY_ADDRESS = Deno.env.get("COMPANY_ADDRESS") || "Tu Empresa · Dirección · Ciudad · País";
const LIST_UNSUBSCRIBE_EMAIL = Deno.env.get("LIST_UNSUBSCRIBE_EMAIL") || "";

console.log('[Mail-send-vacations] Iniciando función');
console.log('[Mail-send-vacations] Variables de entorno:', {
  hasSendGridKey: !!SENDGRID_API_KEY,
  sendGridKeyLength: SENDGRID_API_KEY?.length || 0,
  from: FROM,
  fromName: FROM_NAME,
  replyTo: REPLY_TO_EMAIL,
  appUrl: APP_URL,
});

function buildEmail(payload: Payload) {
  const { to, status, type, employeeName, start_date, end_date, comment, decidedByName } = payload;

  const isApproved = status === "approved";
  const fixedEmployeeName = employeeName?.trim() || "Usuario";
  const fixedComment = comment?.trim() || "";
  const fixedDecidedByName = decidedByName?.trim() || "";

  const range = end_date ? `${start_date} a ${end_date}` : start_date;
  const statusText = isApproved ? "aprobada" : "rechazada";
  const statusBg = isApproved ? "#d1fae5" : "#fee2e2";
  const statusColor = isApproved ? "#065f46" : "#7f1d1d";

  const subjectBase = "[Gestor de Trabajo] Solicitud de vacaciones/día libre";
  const subjectStatus = isApproved ? "aprobada" : "rechazada";
  const subject = `${subjectBase} ${subjectStatus}`;

  const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          line-height: 1.6;
          color: #1f2937;
          margin: 0;
          padding: 0;
          background-color: #f9fafb;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }
        .content {
          padding: 40px 30px;
        }
        .status-badge {
          display: inline-block;
          background-color: ${statusBg};
          color: ${statusColor};
          padding: 12px 24px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 24px;
          border-left: 4px solid ${statusColor};
        }
        .details-box {
          background-color: #f3f4f6;
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
          border-left: 4px solid #667eea;
        }
        .detail-row {
          display: flex;
          margin-bottom: 12px;
          align-items: flex-start;
        }
        .detail-row:last-child {
          margin-bottom: 0;
        }
        .detail-label {
          font-weight: 600;
          color: #6b7280;
          min-width: 120px;
        }
        .detail-value {
          color: #1f2937;
        }
        .comment-box {
          background-color: #fffbeb;
          border-left: 4px solid #f59e0b;
          padding: 16px;
          border-radius: 6px;
          margin: 24px 0;
        }
        .comment-box strong {
          display: block;
          color: #b45309;
          margin-bottom: 8px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .comment-text {
          color: #92400e;
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer-text {
          font-size: 13px;
          color: #6b7280;
          margin: 0;
        }
        .footer-divider {
          height: 1px;
          background-color: #e5e7eb;
          margin: 16px 0;
        }
        .signature {
          margin-top: 8px;
          font-weight: 600;
          color: #1f2937;
        }
        .greeting {
          font-size: 16px;
          margin-bottom: 24px;
          color: #1f2937;
        }
        .main-message {
          font-size: 16px;
          margin-bottom: 24px;
          color: #374151;
          line-height: 1.8;
        }
      </style>
    </head>
    <body>
      <!-- Preheader (oculto) para mejorar entregabilidad y contexto en inbox -->
      <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden">
        ${isApproved ? 'Tu solicitud ha sido aprobada.' : 'Tu solicitud ha sido rechazada.'} Fechas: ${range}
      </span>
      <div class="container">
        <div class="header">
          <h1>Gestor de Trabajo</h1>
          <p>Notificación de solicitud</p>
        </div>

        <div class="content">
          <div class="greeting">
            <strong>Hola ${fixedEmployeeName},</strong>
          </div>

          <div class="status-badge">
            Solicitud ${statusText}
          </div>

          <div class="main-message">
            Tu solicitud de ${type === "vacation" ? "vacaciones" : "día libre"} ha sido <strong>${isApproved ? "aprobada" : "rechazada"}</strong>.
          </div>

          <div class="details-box">
            <div class="detail-row">
              <div class="detail-label">Tipo:</div>
              <div class="detail-value">${type === "vacation" ? "Vacaciones" : "Día Libre"}</div>
            </div>
            <div class="detail-row">
              <div class="detail-label">Fechas:</div>
              <div class="detail-value">${range}</div>
            </div>
            ${fixedDecidedByName ? `<div class="detail-row">
              <div class="detail-label">Decidido por:</div>
              <div class="detail-value">${fixedDecidedByName}</div>
            </div>` : ""}
          </div>

          ${fixedComment ? `<div class="comment-box">
            <strong>Comentario:</strong>
            <div class="comment-text">${fixedComment}</div>
          </div>` : ""}

          <div style="margin-top: 32px; text-align: center; padding: 24px; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #667eea;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              Si tienes alguna pregunta sobre esta decisión, por favor contacta con tu administrador.
            </p>
          </div>
        </div>

        <div class="footer">
          <p class="footer-text">
            Este es un correo automático del sistema de Gestor de Trabajo.
          </p>
          <div class="footer-divider"></div>
          <p class="signature">Gestor de Trabajo</p>
          ${COMPANY_ADDRESS ? `<p class="footer-text" style="margin-top:8px">${COMPANY_ADDRESS}</p>` : ""}
          ${APP_URL ? `<p class="footer-text" style="margin-top:4px">Puedes gestionar tus notificaciones en ${APP_URL}/notifications</p>` : ""}
        </div>
      </div>
    </body>
    </html>`;

  const text = `Gestor de Trabajo\n${subjectBase} ${subjectStatus}\n\nHola ${fixedEmployeeName},\n\nTu solicitud de ${type === "vacation" ? "vacaciones" : "día libre"} para ${range} ha sido ${isApproved ? "aprobada" : "rechazada"}.\n\nDetalles:\n- Tipo: ${type === "vacation" ? "Vacaciones" : "Día Libre"}\n- Fechas: ${range}\n${fixedDecidedByName ? `- Decidido por: ${fixedDecidedByName}\n` : ""}${fixedComment ? `- Comentario: ${fixedComment}\n` : ""}\n\nSi tienes alguna pregunta sobre esta decisión, por favor contacta con tu administrador.\n`;

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
    console.error('[Mail-send-vacations]', error);
    return { status: 500, body: JSON.stringify({ error }) };
  }

  if (!FROM) {
    const error = "Missing FROM_EMAIL (verifica Single Sender en SendGrid o usa dominio autenticado)";
    console.error('[Mail-send-vacations]', error);
    return { status: 500, body: JSON.stringify({ error }) };
  }

  try {
    // SendGrid requiere: text/plain primero, luego text/html
    const listUnsubLink = `${APP_URL}/notifications`;
    const listUnsubHeader = (APP_URL || LIST_UNSUBSCRIBE_EMAIL)
      ? [
          LIST_UNSUBSCRIBE_EMAIL ? `mailto:${LIST_UNSUBSCRIBE_EMAIL}` : null,
          APP_URL ? `${listUnsubLink}` : null,
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
      categories: categories && categories.length ? categories.slice(0, 10) : [ 'vacation-decision' ],
      content: [
        ...(text ? [{ type: "text/plain", value: text }] : []),
        {
          type: "text/html",
          value: html,
        },
      ],
    };

    console.log('[Mail-send-vacations] Enviando a SendGrid:', { to, toName, from: `${FROM_NAME} <${FROM}>`, subject });

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const body = await res.text();

    if (res.status !== 202) {
      console.error('[Mail-send-vacations] Error SendGrid:', { status: res.status, body });
    } else {
      console.log('[Mail-send-vacations] Email enviado exitosamente');
    }

    return { status: res.status, body };
  } catch (e) {
    const errorMsg = String(e);
    console.error('[Mail-send-vacations] Error al enviar con SendGrid:', errorMsg);
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
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const payload = (await req.json()) as Payload;

    // Log para debugging
    console.log('[Mail-send-vacations] Payload recibido:', payload);

    // Validar que los campos requeridos estén presentes y no sean undefined/null/empty
    if (!payload?.to?.trim() || !payload?.status || !payload?.type || !payload?.employeeName?.trim() || !payload?.start_date?.trim()) {
      const missingFields = [];
      if (!payload?.to?.trim()) missingFields.push('to');
      if (!payload?.status) missingFields.push('status');
      if (!payload?.type) missingFields.push('type');
      if (!payload?.employeeName?.trim()) missingFields.push('employeeName');
      if (!payload?.start_date?.trim()) missingFields.push('start_date');

      console.log('[Mail-send-vacations] Campos faltantes:', missingFields);
      return new Response(JSON.stringify({ error: "Invalid payload", missing: missingFields }), {
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
      [ 'vacation-decision', payload.type, payload.status ]
    );

    // SendGrid retorna 202 si es exitoso
    if (resp.status === 202) {
      return new Response(JSON.stringify({ success: true, message: "Email sent successfully" }), {
        status: 200,
        headers: corsHeaders,
      });
    } else if (resp.status >= 400) {
      // Error de SendGrid
      console.error('[Mail-send-vacations] Error de SendGrid:', resp.body);
      return new Response(resp.body, {
        status: resp.status,
        headers: corsHeaders,
      });
    } else {
      // Otros status
      return new Response(resp.body, {
        status: 200,
        headers: corsHeaders,
      });
    }
  } catch (e) {
    console.error('[Mail-send-vacations] Error:', String(e));
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
