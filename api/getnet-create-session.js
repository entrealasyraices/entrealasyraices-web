// api/getnet-create-session.js
// Función Serverless (Vercel) para crear una sesión de pago en Getnet Web Checkout (ambiente de pruebas)

const crypto = require("crypto");

module.exports = async (req, res) => {
  // Aceptamos solo método POST
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método no permitido" });
    return;
  }

  try {
    // 1. Recibir datos desde el front-end
    const { amount, reference, description } = req.body;

    if (!amount || !reference || !description) {
      res.status(400).json({
        ok: false,
        error: "Faltan parámetros obligatorios: amount, reference o description",
      });
      return;
    }

    // 2. Leer credenciales desde Vercel
    const baseUrl = process.env.GETNET_BASE_URL;   // Ej: https://checkout.test.getnet.cl
    const login = process.env.GETNET_LOGIN;        // Login de pruebas
    const secretKey = process.env.GETNET_SECRET_KEY; // Trankey de pruebas

    if (!baseUrl || !login || !secretKey) {
      res.status(500).json({
        ok: false,
        error: "Variables de entorno faltantes en Vercel",
      });
      return;
    }

    // 3. Construir autenticación (según documentación Web Checkout Getnet)
    const seed = new Date().toISOString(); // Fecha en formato ISO 8601
    const nonceRaw = crypto.randomBytes(16); // bytes aleatorios
    const nonce = nonceRaw.toString("base64");

    const tranKey = crypto
      .createHash("sha256")
      .update(nonceRaw.toString("utf8") + seed + secretKey)
      .digest("base64");

    // 4. Construir valores obligatorios requeridos por la API
    const expiration = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const ipAddress = req.headers["x-forwarded-for"]?.split(",")[0] || "127.0.0.1";
    const userAgent = req.headers["user-agent"] || "EntreAlasYRaices";

    // **IMPORTANTE**
    // Esta será la URL donde Getnet redirige al usuario después del pago.
    const returnUrl = "https://entrealasyraices-web.vercel.app/getnet-retorno.html";

    // 5. Estructura que exige Getnet Web Checkout
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

    // 6. Llamado al endpoint oficial de Getnet
    const response = await fetch(`${baseUrl}/api/session/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    // 7. Validación de respuesta Getnet
    if (data.status?.status === "OK") {
      res.status(200).json({
        ok: true,
        requestId: data.requestId,
        processUrl: data.processUrl, // URL donde el cliente realiza el pago
      });
    } else {
      res.status(400).json({
        ok: false,
        error: "Getnet rechazó la creación de la sesión",
        details: data,
      });
    }
  } catch (err) {
    // 8. Manejo de errores del servidor
    res.status(500).json({
      ok: false,
      error: "Error interno al comunicar con Getnet",
      details: err.message,
    });
  }
};
