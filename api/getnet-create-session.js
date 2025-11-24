// api/getnet-create-session.js
// Función de Vercel que crea la sesión de pago en Getnet (ambiente de pruebas)

const crypto = require("crypto");

module.exports = async (req, res) => {
  // Solo permitimos método POST
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.json({ error: "Método no permitido" });
    return;
  }

  // 1. Datos que vienen desde el front (monto, referencia, descripción)
  const { amount, reference, description } = req.body;

  // 2. Credenciales desde las variables de entorno de Vercel
  const baseUrl = process.env.GETNET_BASE_URL;   // https://checkout.test.getnet.cl
  const login = process.env.GETNET_LOGIN;        // Login de pruebas
  const secretKey = process.env.GETNET_TRANKEY;  // Trankey de pruebas

  // 3. Armamos el objeto auth (según documentación Web Checkout)
  const seed = new Date().toISOString(); // fecha actual en ISO 8601
  const nonceRaw = crypto.randomBytes(16); // número aleatorio
  const nonce = nonceRaw.toString("base64");

  const tranKey = crypto
    .createHash("sha256")
    .update(nonceRaw.toString("utf8") + seed + secretKey)
    .digest("base64");

  // IP y userAgent (obligatorios en la API)
  const ipAddress =
    (req.headers["x-forwarded-for"] || "").split(",")[0] ||
    req.socket?.remoteAddress ||
    "127.0.0.1";

  const userAgent = req.headers["user-agent"] || "EntreAlasYRaices";

  // 4. La sesión vence en 15 minutos más
  const expiration = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  // 5. URL de retorno (por ahora usaremos el dominio de Vercel)
  const returnUrl =
    "https://entrealasyraices-web.vercel.app/getnet-retorno.html";

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
      // Todo salió bien: devolvemos la URL de pago
      res.statusCode = 200;
      res.json({
        ok: true,
        requestId: data.requestId,
        processUrl: data.processUrl,
      });
    } else {
      // Hubo algún problema en la creación de la sesión
      res.statusCode = 400;
      res.json({
        ok: false,
        message: "Error al crear la sesión de pago en Getnet",
        data,
      });
    }
  } catch (err) {
    // Error de conexión o similar
    res.statusCode = 500;
    res.json({
      ok: false,
      message: "Error comunicando con Getnet",
      error: err.message,
    });
  }
};
