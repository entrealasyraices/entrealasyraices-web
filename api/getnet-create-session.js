// api/getnet-create-session.js
// Función de Vercel que crea la sesión de pago en Getnet

const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.json({ error: "Método no permitido" });
    return;
  }

  const { amount, reference, description } = req.body;

  // 1. Credenciales desde las variables de entorno de Vercel
  const baseUrl = process.env.GETNET_BASE_URL;
  const login = process.env.GETNET_LOGIN;
  const secretKey = process.env.GETNET_SECRET_KEY;

  // 2. Armamos el objeto auth (según manual Web Checkout)
  const seed = new Date().toISOString(); // fecha actual en ISO 8601
  const nonceRaw = crypto.randomBytes(16); // número aleatorio
  const nonce = nonceRaw.toString("base64");

  const tranKey = crypto
    .createHash("sha256")
    .update(nonceRaw.toString("utf8") + seed + secretKey)
    .digest("base64");

  const ipAddress =
    (req.headers["x-forwarded-for"] || "").split(",")[0] ||
    req.socket?.remoteAddress ||
    "127.0.0.1";

  const userAgent = req.headers["user-agent"] || "EntreAlasYRaices";

  // 3. La sesión vence en 15 minutos más (recomendación manual)
  const expiration = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // ⚠️ Reemplaza TU-DOMINIO-VERCEL por el dominio real de tu sitio
  const returnUrl = `https://TU-DOMINIO-VERCEL/getnet-retorno.html?reference=${encodeURIComponent(
    reference
  )}`;

  const body = {
    auth: {
      login,
      tranKey,
      nonce,
      seed,
    },
    locale: "es_CL",
    payment: {
      reference,
      description,
      amount: {
        currency: "CLP",
        total: amount,
      },
    },
    expiration,
    returnUrl,
    ipAddress,
    userAgent,
  };

  try {
    const response = await fetch(`${baseUrl}/api/session/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.status && data.status.status === "OK") {
      res.statusCode = 200;
      res.json({
        ok: true,
        requestId: data.requestId,
        processUrl: data.processUrl,
      });
    } else {
      res.statusCode = 400;
      res.json({
        ok: false,
        message: "Error al crear la sesión de pago",
        data,
      });
    }
  } catch (err) {
    res.statusCode = 500;
    res.json({
      ok: false,
      message: "Error comunicando con Getnet",
      error: err.message,
    });
  }
};
