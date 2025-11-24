// api/getnet-create-session.js
// Función Serverless (Vercel) para crear una sesión de pago en Getnet Web Checkout (pruebas)

const crypto = require("crypto");

module.exports = async (req, res) => {
  // Solo permitimos método POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  try {
    // 1. Datos que vienen desde el front-end
    const { amount, reference, description } = req.body || {};

    if (!amount || !reference || !description) {
      res.status(400).json({
        ok: false,
        error: "Faltan parámetros obligatorios: amount, reference o description",
      });
      return;
    }

    // 2. Credenciales desde Vercel
    const baseUrl = process.env.GETNET_BASE_URL;      // https://checkout.test.getnet.cl
    const login = process.env.GETNET_LOGIN;           // Login de pruebas
    const secretKey = process.env.GETNET_SECRET_KEY;  // Trankey de pruebas

    if (!baseUrl || !login || !secretKey) {
      res.status(500).json({
        ok: false,
        error: "Variables de entorno faltantes en Vercel",
      });
      return;
    }

    // 3. AUTENTICACIÓN según manual:
    // tranKey = Base64( SHA-256( nonce + seed + secretKey ) )
    // nonce se envía en Base64
    const seed = new Date().toISOString(); // fecha en formato ISO 8601
    const nonce = crypto.randomBytes(16).toString("base64");

    const tranKey = crypto
      .createHash("sha256")
      .update(nonce + seed + secretKey, "utf8")
      .digest("base64");

    // 4. Otros campos requeridos
    const expiration = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const ipAddress =
      (req.headers["x-forwarded-for"] || "").split(",")[0] ||
      req.socket?.remoteAddress ||
      "127.0.0.1";

    const userAgent = req.headers["user-agent"] || "EntreAlasYRaices";

    // URL donde el cliente vuelve después de pagar
    const returnUrl =
      "https://entrealasyraices-web.vercel.app/getnet-retorno.html";

    // 5. Cuerpo de la petición CreateRequest (Web Checkout)
    const requestBody = {
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

    // 6. Llamado al endpoint de Getnet
    const response = await fetch(`${baseUrl}/api/session/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // 7. Validar respuesta
    if (data.status && data.status.status === "OK") {
      res.status(200).json({
        ok: true,
        requestId: data.requestId,
        processUrl: data.processUrl,
      });
    } else {
      res.status(400).json({
        ok: false,
        error: "Getnet rechazó la creación de la sesión",
        details: data,
      });
    }
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: "Error interno al comunicar con Getnet",
      details: err.message,
    });
  }
};
