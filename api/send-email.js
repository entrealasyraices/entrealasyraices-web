// /API/send-email.js
import nodemailer from "nodemailer";

const formatCLP = (value) => {
  const n = Number(value || 0);
  return n.toLocaleString("es-CL");
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

  try {
    const {
      nombre,
      apellido,
      rut,
      telefono,
      correo,
      tipoDocumento,
      empresa,
      rutEmpresa,
      razonSocial,
      direccionEmpresa,
      direccionDespacho,
      comuna,
      ciudad,
      region,
      comentarios,
      productos,
      subtotal,
      envio,
      total,
      ivaProducto,
    } = req.body;

    // Transport con Gmail + contraseña de aplicación
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // contacto@entrealasyraices.cl
        pass: process.env.GMAIL_PASS, // contraseña de aplicación de Google
      },
    });

    // ==========================
    // 1) Correo para TI (notificación interna)
    // ==========================
    const productosHtml = (productos || [])
      .map(
        (p) =>
          `<li>${p.name} x${p.qty} — $${formatCLP(
            p.price
          )} c/u (subtotal $${formatCLP(p.price * p.qty)})</li>`
      )
      .join("");

    await transporter.sendMail({
      from: `"Entre Alas y Raíces" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `🛍️ Nuevo pedido - ${nombre} ${apellido}`,
      html: `
        <h2>Nuevo pedido recibido</h2>

        <h3>Datos de la persona que compra</h3>
        <p><strong>Nombre:</strong> ${nombre} ${apellido}</p>
        <p><strong>RUT:</strong> ${rut}</p>
        <p><strong>Teléfono:</strong> ${telefono}</p>
        <p><strong>Correo:</strong> ${correo}</p>

        <h3>Documento solicitado</h3>
        <p><strong>Tipo de documento:</strong> ${tipoDocumento}</p>

        ${
          tipoDocumento === "Factura"
            ? `
        <h4>Datos de empresa</h4>
        <p><strong>Nombre empresa:</strong> ${empresa || "-"}</p>
        <p><strong>RUT empresa:</strong> ${rutEmpresa || "-"}</p>
        <p><strong>Razón social:</strong> ${razonSocial || "-"}</p>
        <p><strong>Dirección empresa:</strong> ${direccionEmpresa || "-"}</p>
        `
            : ""
        }

        <h3>Datos de despacho</h3>
        <p><strong>Dirección:</strong> ${direccionDespacho}</p>
        <p><strong>Comuna:</strong> ${comuna}</p>
        <p><strong>Ciudad:</strong> ${ciudad}</p>
        <p><strong>Región:</strong> ${region}</p>
        <p><strong>Comentarios:</strong> ${comentarios || "Sin comentarios"}</p>

        <h3>Detalle del pedido</h3>
        <ul>
          ${productosHtml || "<li>(Sin detalle de productos)</li>"}
        </ul>

        <p><strong>Subtotal productos:</strong> $${formatCLP(subtotal)}</p>
        <p><strong>Envío:</strong> $${formatCLP(envio)}</p>
        <p><strong>Total:</strong> $${formatCLP(total)}</p>
        <p><strong>IVA (19% sobre productos):</strong> $${formatCLP(
          ivaProducto
        )}</p>
      `,
    });

    // ==========================
    // 2) Correo para la PERSONA que compra
    // ==========================
    await transporter.sendMail({
      from: `"Entre Alas y Raíces" <${process.env.GMAIL_USER}>`,
      to: correo,
      subject: "✨ Hemos recibido tu compra – Entre Alas y Raíces",
      html: `
        <h2>¡Gracias por tu compra, ${nombre}! 💚</h2>
        <p>Estamos preparando tu pedido. Pronto recibirás nuevas noticias cuando esté listo para despacho.</p>

        <p><strong>Resumen:</strong></p>
        <ul>
          ${productosHtml || "<li>Pedido registrado.</li>"}
        </ul>

        <p><strong>Total pagado:</strong> $${formatCLP(total)}</p>
        <p><strong>Incluye IVA (19% sobre productos):</strong> $${formatCLP(
          ivaProducto
        )}</p>

        <p>Si tienes dudas, puedes escribirnos a:<br>
        contacto@entrealasyraices.cl</p>

        <p>Gracias por confiar en <strong>Entre Alas y Raíces</strong> 🌱</p>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error al enviar correos:", error);
    return res.status(500).json({
      ok: false,
      error: "Error al enviar correos",
      details: error.message,
    });
  }
}
