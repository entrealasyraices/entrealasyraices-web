// /api/order-notify.js
// Envía un correo interno con los datos del pedido usando Resend (o similar)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.ORDER_NOTIFY_TO; // tu correo interno, ej: ventas@entrealasyraices.cl

  if (!RESEND_API_KEY || !TO_EMAIL) {
    console.warn("Faltan RESEND_API_KEY u ORDER_NOTIFY_TO en variables de entorno");
    // No tiramos error fuerte para no romper la experiencia del cliente
    return res.status(200).json({
      ok: false,
      warning: "Notificación no enviada (faltan variables de entorno en Vercel)",
    });
  }

  let order;
  try {
    order = req.body;
    if (typeof order === "string") {
      order = JSON.parse(order);
    }
  } catch (err) {
    return res.status(400).json({ ok: false, error: "JSON de orden inválido" });
  }

  const {
    reference,
    amount,
    subtotal,
    shipping,
    iva,
    tipoDocumento,
    comprador = {},
    factura = {},
    despacho = {},
    items = [],
  } = order || {};

  const itemsHtml = items
    .map(
      (p) => `
      <li>
        <strong>${p.name}</strong> (x${p.qty}) – $${Number(p.price || 0).toLocaleString("es-CL")}
      </li>`
    )
    .join("");

  const html = `
    <h2>Nuevo pedido en Entre Alas y Raíces</h2>
    <p><strong>N° de pedido:</strong> ${reference || "—"}</p>
    <p><strong>Tipo documento:</strong> ${tipoDocumento || "—"}</p>

    <h3>Datos del comprador</h3>
    <ul>
      <li>Nombre: ${comprador.nombre || ""} ${comprador.apellido || ""}</li>
      <li>RUT: ${comprador.rut || ""}</li>
      <li>Teléfono: ${comprador.telefono || ""}</li>
      <li>Correo: ${comprador.correo || ""}</li>
    </ul>

    ${
      tipoDocumento === "factura"
        ? `
      <h3>Datos de factura</h3>
      <ul>
        <li>Empresa: ${factura.empresa || ""}</li>
        <li>RUT empresa: ${factura.rutEmpresa || ""}</li>
        <li>Razón social: ${factura.razonSocial || ""}</li>
        <li>Dirección: ${factura.direccion || ""}</li>
      </ul>
    `
        : ""
    }

    <h3>Datos de despacho</h3>
    <ul>
      <li>Dirección: ${despacho.direccionCalle || ""}</li>
      <li>Comuna: ${despacho.comuna || ""}</li>
      <li>Ciudad: ${despacho.ciudad || ""}</li>
      <li>Región: ${despacho.region || ""}</li>
      <li>Info adicional: ${despacho.infoAdicional || ""}</li>
      <li>Comentarios: ${despacho.comentarios || ""}</li>
    </ul>

    <h3>Productos</h3>
    <ul>
      ${itemsHtml || "<li>(sin ítems)</li>"}
    </ul>

    <h3>Montos</h3>
    <ul>
      <li>Subtotal: $${Number(subtotal || 0).toLocaleString("es-CL")}</li>
      <li>Envío: $${Number(shipping || 0).toLocaleString("es-CL")}</li>
      <li>IVA (19% productos): $${Number(iva || 0).toLocaleString("es-CL")}</li>
      <li><strong>Total:</strong> $${Number(amount || 0).toLocaleString("es-CL")}</li>
    </ul>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Entre Alas y Raíces <no-reply@entrealasyraices.cl>",
        to: [TO_EMAIL],
        subject: `Nuevo pedido - ${reference || "sin referencia"}`,
        html,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Error desde Resend:", text);
      return res.status(500).json({
        ok: false,
        error: "No se pudo enviar el correo de notificación",
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error interno al enviar notificación:", err);
    return res.status(500).json({
      ok: false,
      error: "Error interno al enviar notificación",
    });
  }
}

