export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { amount, reference, description } = req.body;

    if (!amount || !reference || !description) {
      return res.status(400).json({
        ok: false,
        error: "Faltan campos obligatorios"
      });
    }

    // Variables desde Vercel
    const LOGIN = process.env.GETNET_LOGIN;
    const SECRET = process.env.GETNET_SECRET_KEY;
    const BASE_URL = process.env.GETNET_BASE_URL;

    if (!LOGIN || !SECRET || !BASE_URL) {
      return res.status(500).json({
        ok: false,
        error: "Variables de entorno faltantes"
      });
    }

    // Basic Auth
    const token = Buffer.from(`${LOGIN}:${SECRET}`).toString("base64");

    // Body para API Getnet
    const body = {
      amount: amount,
      reference: reference,
      description: description,
      currency: "CLP",
      webpay: {
        callbackUrl: "https://entrealasyraices.cl/pago-exitoso.html"
      }
    };

    // Llamado Getnet
    const response = await fetch(`${BASE_URL}/webpay/v2.3/initiate-payment`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    // Getnet a veces responde en texto → NO usar response.json() directamente
    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({
        ok: false,
        error: "Getnet devolvió una respuesta no JSON",
        raw: text
      });
    }

    // Si viene el processUrl
    if (data?.processUrl) {
      return res.status(200).json({
        ok: true,
        processUrl: data.processUrl
      });
    }

    // Si falla
    return res.status(400).json({
      ok: false,
      error: "Getnet rechazó la creación",
      details: data
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Error interno del servidor",
      details: err.message
    });
  }
}
