import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Método no permitido" });
  }

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
    ivaProducto
  } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // 📌 Email para ti (notificación del pedido)
    await transporter.sendMail({
      from: `"Entre Alas y Raíces" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      subject: `🛍️ Nuevo Pedido - ${nombre} ${apellido}`,
      html: `
        <h2>Nuevo Pedido Recibido</h2>
        <p><strong>Cliente:</strong> ${nombre} ${apellido}</p>
        <p><strong>RUT:</strong> ${rut}</p>
        <p><strong>Teléfono:</strong> ${telefono}</p>
        <p><strong>Email:</strong> ${correo}</p>
        <p><strong>Tipo de Documento:</strong> ${tipoDocumento}</p>

        ${
          tipoDocumento === "Factura"
            ? `
          <h3>Datos de Empresa</h3>
          <p><strong>RUT Empresa:</strong> ${rutEmpresa}</p>
          <p><strong>Razón Social:</strong> ${razonSocial}</p>
          <p><strong>Dirección Empresa:</strong> ${direccionEmpresa}</p>
        `
            : ""
        }

        <h3>Datos de Entrega</h3>
        <p><strong>Dirección:</strong> ${direccionDespacho}</p>
        <p><strong>Comuna:</strong> ${comuna}</p>
        <p><strong>Ciudad:</strong> ${ciudad}</p>
        <p><strong>Región:</strong> ${region}</p>
        <p><strong>Comentarios:</strong> ${comentarios || "Sin comentarios"}</p>

        <h3>Pedido</h3>
        ${productos
          ?.map(
            (p) =>
              `<p>${p.name} x${p.qty} — $${p.price.toLocaleString("es-CL")}</p>`
          )
          .join("")}

        <p><strong>Subtotal:</strong> $${subtotal.toLocaleString("es-CL")}</p>
        <p><strong>Envío:</strong> $${envio.toLocaleString("es-CL")}</p>
        <p><strong>Total:</strong> $${total.toLocaleString("es-CL")}</p>
        <p><strong>Incluye IVA:</strong> $${ivaProducto.toLocaleString(
          "es-CL"
        )}</p>
      `,
    });

    // 📌 Email para el cliente
    await transporter.sendMail({
      from: `"Entre Alas y Raíces" <${process.env.GMAIL_USER}>`,
      to: correo,
      subject: "✨ Tu compra fue recibida - Entre Alas y Raíces",
      html: `
        <h2>¡Gracias por tu compra, ${nombre}! 💚</h2>
        <p>Estamos preparando tu pedido y te avisaremos cuando esté en camino.</p>
        <p><strong>Total pagado:</strong> $${total.toLocaleString("es-CL")}</p>
        <p>Si necesitas ayuda, escríbenos a:<br>
        contacto@entrealasyraices.cl</p>
        <p>¡Gracias por confiar en nosotros! 🌱</p>
      `,
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Error al enviar correos:", error);
    res.status(500).json({
      ok: false,
      error: "Error al enviar correos",
      details: error.message,
    });
  }
}
