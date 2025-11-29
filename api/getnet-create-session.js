// /api/getnet-create-session.js
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { amount, reference, description } = req.body;

    if (!amount || !reference || !description) {
      return res.status(400).json({
        ok: false,
        error: "Faltan campos obligatorios (amount, reference, description)",
      });
    }

    const LOGIN = process.env.GETNET_LOGIN;
    const SECRET = process.env.GETNET_SECRET_KEY;
    const BASE_URL = process.env.GETNET_BASE_URL; // https://checkout.test.getnet.cl en pruebas

    if (!LOGIN || !SECRET || !BASE_URL) {
      return res.status(500).json({
        ok: false,
        error:
          "Variables de entorno GETNET_LOGIN / GETNET_SECRET_KEY / GETNET_BASE_URL no están definidas",
      });
    }

    // 1. Autenticación Web Checkout
    const seed = new Date().toISOString();
    const nonceRaw = crypto.randomBytes(16).toString("hex");
    const nonceBase64 = Buffer.from(nonceRaw).toString("base64");

    const tranKey = crypto
      .createHash("sha256")
      .update(nonceRaw + seed + SECRET)
      .digest("base64");

    const auth = {
      login: LOGIN,
      tranKey,
      nonce: nonceBase64,
      seed,
    };

    // 2. Datos del pago (createRequest)
    const expiration = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const clientIp =
      (req.headers["x-forwarded-for"] || "")
        .toString()
        .split(",")[0]
        .trim() || req.socket.remoteAddress || "127.0.0.1";

    const userAgent = req.headers["user-agent"] || "Unknown";

    const body = {
      auth,
      locale: "es_CL",
      payment: {
        reference,
        description,
        amount: {
          currency: "CLP",
          total: Number(amount),
        },
      },
      expiration,
      // ⬇⬇ CAMBIO IMPORTANTE: página neutra de resultado, NO "exitoso"
      returnUrl: `https://entrealasyraices.cl/pago-resultado.html?reference=${encodeURIComponent(
        reference
      )}`,
      ipAddress: clientIp,
      userAgent,
    };

    // 3. Llamada a Web Checkout
    const response = await fetch(`${BASE_URL}/api/session/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("Respuesta no JSON desde Getnet:", text);
      return res.status(500).json({
        ok: false,
        error: "Getnet devolvió una respuesta no JSON",
        raw: text,
      });
    }

    if (!response.ok || data.status?.status !== "OK") {
      console.error("Error desde Getnet createRequest:", data);
      return res.status(500).json({
        ok: false,
        error: "Error al crear la sesión en Getnet",
        getnetStatus: data.status || null,
      });
    }

    // Si todo va bien, retornamos la URL donde debe ir el cliente
    return res.status(200).json({
      ok: true,
      requestId: data.requestId,
      processUrl: data.processUrl,
    });
  } catch (err) {
    console.error("Error interno en getnet-create-session:", err);
    return res.status(500).json({
      ok: false,
      error: "Error interno del servidor",
      details: err.message,
    });
  }
}
