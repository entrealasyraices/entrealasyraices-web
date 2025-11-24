// /api/getnet-create-session.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { amount, reference, description } = req.body;
  const baseUrl = process.env.GETNET_BASE_URL;
  const login = process.env.GETNET_LOGIN;
  const secretKey = process.env.GETNET_SECRET_KEY;

  try {
    // 1) Crear Auth Token
    const authResponse = await fetch(`${baseUrl}/v1/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login,
        tranKey: secretKey
      }),
    });

    const authData = await authResponse.json();

    if (!authData.token) {
      return res.status(400).json({
        ok: false,
        error: "Error autenticando en Getnet",
        details: authData
      });
    }

    const token = authData.token;

    // 2) Crear la sesión WebCheckout
    const sessionResponse = await fetch(`${baseUrl}/v1/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify({
        amount: amount,
        currency: "CLP",
        buyOrder: reference,
        sessionId: reference,
        returnUrl: "https://entrealasyraices.cl/confirmacion.html",
        cancelUrl: "https://entrealasyraices.cl/cancelado.html",
        merchant: login,
        description
      }),
    });

    const sessionData = await sessionResponse.json();

    if (!sessionData.processUrl) {
      return res.status(400).json({
        ok: false,
        error: "Getnet rechazó la creación de la sesión",
        details: sessionData
      });
    }

    return res.status(200).json({
      ok: true,
      processUrl: sessionData.processUrl
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Error interno de servidor",
      details: err.message
    });
  }
}
