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
  isUpdate?: boolean; // true si es una edición, false/undefined si es creación
  // Datos antiguos para comparación (solo cuando isUpdate = true)
  old_start_date?: string;
  old_start_time?: string | null;
  old_end_time?: string | null;
  old_location?: string | null;
  // Flags para cambio de empleado
  isEmployeeRemoval?: boolean; // true si se le quitó la tarea al empleado
  isEmployeeReassignment?: boolean; // true si se le reasignó la tarea de otro empleado
  previousEmployeeName?: string; // nombre del empleado anterior (para reasignación)
}

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
const FROM = Deno.env.get("FROM_EMAIL") || "";
const FROM_NAME = Deno.env.get("FROM_NAME") || "Gestor de Trabajo";
const REPLY_TO_EMAIL = Deno.env.get("REPLY_TO_EMAIL") || FROM;
const REPLY_TO_NAME = Deno.env.get("REPLY_TO_NAME") || "Soporte Gestor de Trabajo";
const APP_URL = Deno.env.get("APP_URL") || "https://gestor-trabajo.example";
const COMPANY_ADDRESS = Deno.env.get("COMPANY_ADDRESS") || "Tu Empresa · Dirección · Ciudad · País";
const LIST_UNSUBSCRIBE_EMAIL = Deno.env.get("LIST_UNSUBSCRIBE_EMAIL") || "";

function formatDateToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return "Fecha no definida";
  // Asumiendo formato yyyy-mm-dd
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}

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
    description,
    isUpdate,
    old_start_date,
    old_start_time,
    old_end_time,
    old_location,
    isEmployeeRemoval,
    isEmployeeReassignment,
    previousEmployeeName
  } = payload;

  const fixedEmployee = (employeeName || "").trim() || "Equipo";
  const fixedAssignedBy = (assignedBy || "").trim() || "Administrador";
  const fixedTaskTitle = (taskTitle || "").trim() || "Nueva tarea";
  const fixedLocation = (location || "").trim() || "Sin localización";
  const fixedDescription = (description || "").trim();
  const formattedDate = formatDateToDDMMYYYY(start_date);
  const dateRange = end_date && end_date !== start_date ? `${start_date} a ${end_date}` : start_date;

  // Formatear horarios eliminando segundos (HH:MM:SS -> HH:MM)
  const formatTime = (time: string | null | undefined): string => {
    if (!time) return '';
    return time.substring(0, 5); // Extrae solo HH:MM
  };

  const timeRange = start_time && end_time
    ? `${formatTime(start_time)} - ${formatTime(end_time)}`
    : formatTime(start_time) || formatTime(end_time) || "Horario no definido";

  // Datos antiguos (para comparación cuando es edición)
  const oldFormattedDate = old_start_date ? formatDateToDDMMYYYY(old_start_date) : null;
  const oldTimeRange = old_start_time && old_end_time
    ? `${formatTime(old_start_time)} - ${formatTime(old_end_time)}`
    : null;
  const oldFixedLocation = old_location?.trim() || null;

  // Determinar tipo de correo
  let subject: string;
  let headerTitle: string;
  let headerSubtitle: string;
  let introText: string;
  let headerColor: string;

  if (isEmployeeRemoval) {
    // Correo de eliminación por cambio de empleado
    subject = `[Gestor de Trabajo] Tarea eliminada - Cambio de empleado`;
    headerTitle = "Tarea eliminada";
    headerSubtitle = `${fixedAssignedBy} ha reasignado esta tarea a otro empleado`;
    introText = `La tarea "${fixedTaskTitle}" que tenías asignada ha sido reasignada a otro empleado. Ya no aparecerá en tu calendario.`;
    headerColor = '#dc2626'; // Rojo
  } else if (isEmployeeReassignment) {
    // Correo de reasignación a nuevo empleado
    subject = `[Gestor de Trabajo] Nueva tarea reasignada`;
    headerTitle = "Tarea reasignada";
    headerSubtitle = `${fixedAssignedBy} te ha reasignado una tarea de ${previousEmployeeName || 'otro empleado'}`;
    introText = `Se te ha reasignado una tarea que anteriormente estaba asignada a ${previousEmployeeName || 'otro empleado'}. Estos son los detalles:`;
    headerColor = '#059669'; // Verde
  } else {
    // Correo normal (creación o edición)
    const isUpdateTask = isUpdate === true;
    subject = isUpdateTask
      ? `[Gestor de Trabajo] Tarea editada`
      : `[Gestor de Trabajo] Nueva tarea asignada`;
    headerTitle = isUpdateTask ? "Tarea editada" : "Nueva tarea asignada";
    headerSubtitle = isUpdateTask
      ? `${fixedAssignedBy} ha editado una tarea del día ${start_date}`
      : `${fixedAssignedBy} te ha asignado una tarea`;
    introText = isUpdateTask
      ? `Una tarea ha sido editada en el calendario. Estos son los nuevos detalles:`
      : `Se te ha asignado una nueva tarea en el calendario. Estos son los detalles:`;
    headerColor = isUpdateTask ? '#f59e0b' : '#0ea5e9'; // Naranja o azul
  }

  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; color: #111827; margin: 0; padding: 0; }
        .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08); }
        .header { background: linear-gradient(135deg, ${headerColor} 0%, ${headerColor === '#dc2626' ? '#991b1b' : headerColor === '#059669' ? '#047857' : headerColor === '#f59e0b' ? '#d97706' : '#6366f1'} 100%); color: #fff; padding: 32px 28px; }
        .title { margin: 0; font-size: 22px; font-weight: 700; }
        .content { padding: 28px; }
        .section { background: #f3f4f6; border-radius: 10px; padding: 18px; margin-top: 18px; border-left: 4px solid ${headerColor}; }
        .label { font-weight: 600; color: #4b5563; min-width: 110px; display: inline-block; }
        .value { color: #111827; }
        .footer { padding: 18px 28px 26px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <p class="title">${headerTitle}</p>
          <p style="margin: 6px 0 0; opacity: 0.95">${headerSubtitle}</p>
        </div>
        <div class="content">
          <p style="margin: 0 0 14px; font-size: 16px;">Hola <strong>${fixedEmployee}</strong>,</p>
          <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">${introText}</p>
          ${isUpdate && !isEmployeeRemoval && !isEmployeeReassignment ? `
          <div class="section">
            <div style="margin-bottom: 16px; font-weight: 600; color: #1f2937; font-size: 15px;">Comparación de cambios:</div>
            <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 8px;">
              <thead>
                <tr>
                  <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151; font-size: 14px;">Campo</th>
                  <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #dc2626; font-size: 14px;">Anterior</th>
                  <th style="padding: 10px 8px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #059669; font-size: 14px;">Nuevo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500; font-size: 14px;">Lugar</td>
                  <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">${oldFixedLocation || 'N/A'}</td>
                  <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; color: #059669; font-weight: 500; font-size: 14px;">${fixedLocation}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500; font-size: 14px;">Fecha</td>
                  <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">${oldFormattedDate || 'N/A'}</td>
                  <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; color: #059669; font-weight: 500; font-size: 14px;">${formattedDate}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-weight: 500; font-size: 14px;">Horario</td>
                  <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">${oldTimeRange || 'N/A'}</td>
                  <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; color: #059669; font-weight: 500; font-size: 14px;">${timeRange}</td>
                </tr>
              </tbody>
            </table>
            <div style="margin-top: 16px; padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
              <div style="font-weight: 600; color: #92400e; font-size: 14px; margin-bottom: 4px;">✏️ Modificado por</div>
              <div style="color: #78350f; font-size: 14px;">${fixedAssignedBy}</div>
            </div>
          </div>
          ` : `
          <div class="section">
            <div style="margin-bottom: 10px;"><span class="label">Lugar:</span><span class="value">${fixedLocation}</span></div>
            <div style="margin-bottom: 10px;"><span class="label">Empleado:</span><span class="value">${fixedEmployee}</span></div>
            <div style="margin-bottom: 10px;"><span class="label">Fecha:</span><span class="value">${formattedDate}</span></div>
            <div style="margin-bottom: 10px;"><span class="label">Horario:</span><span class="value">${timeRange}</span></div>
            <div><span class="label">Actualizado por:</span><span class="value">${fixedAssignedBy}</span></div>
          </div>
          `}
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

  // Texto plano basado en el tipo de correo
  let text: string;
  if (isEmployeeRemoval) {
    text = `Hola ${fixedEmployee},\n\nLa tarea "${fixedTaskTitle}" que tenías asignada ha sido reasignada a otro empleado por ${fixedAssignedBy}.\n\nLugar: ${fixedLocation}\nFecha: ${formattedDate}\nHorario: ${timeRange}\n\nEsta tarea ya no aparecerá en tu calendario.`;
  } else if (isEmployeeReassignment) {
    text = `Hola ${fixedEmployee},\n\nSe te ha reasignado una tarea que anteriormente estaba asignada a ${previousEmployeeName || 'otro empleado'}.\n\nLugar: ${fixedLocation}\nFecha: ${formattedDate}\nHorario: ${timeRange}\nReasignado por: ${fixedAssignedBy}\n\nRevisa el calendario para más detalles.`;
  } else if (isUpdate) {
    text = `Hola ${fixedEmployee},\n\nUna tarea ha sido editada en el día ${start_date}.\n\nLugar: ${fixedLocation}\nEmpleado: ${fixedEmployee}\nFecha: ${formattedDate}\nHorario: ${timeRange}\nActualizado por: ${fixedAssignedBy}${fixedDescription ? `\n\nMotivo/Detalles:\n${fixedDescription}` : ''}\n\nRevisa el calendario para más detalles.`;
  } else {
    text = `Hola ${fixedEmployee},\n\nTienes una nueva tarea asignada.\n\nLugar: ${fixedLocation}\nEmpleado: ${fixedEmployee}\nFecha: ${formattedDate}\nHorario: ${timeRange}\nAsignado por: ${fixedAssignedBy}${fixedDescription ? `\n\nMotivo/Detalles:\n${fixedDescription}` : ''}\n\nRevisa el calendario para más detalles.`;
  }

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
    const category = payload.isUpdate ? 'task-update' : 'task-assignment';
    const resp = await sendWithSendGrid(
      payload.to,
      subject,
      html,
      text,
      payload.employeeName,
      [ category ]
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
