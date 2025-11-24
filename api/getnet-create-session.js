// /api/getnet-create-session.js
// Integración Web Checkout API 2.3 – Getnet Chile (Ambiente de pruebas)

import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { amount, reference, description } = req.body;

    if (!amount || !reference || !description) {
      return res.status(400).json({
        ok: false,
        error: "Faltan campos obligatorios: amount, reference, description"
      });
    }

    // Credenciales desde Vercel
    const login = process.env.GETNET_LOGIN;
    const secretKey = process.env.GETNET_SECRET_KEY;
    const baseUrl = process.env.GETNET_BASE_URL;

    if (!login || !secretKey || !baseUrl) {
      return res.status(500).json({
        ok: false,
        error: "Faltan variables GETNET en Vercel"
      });
    }

    // Construcción de Basic Auth (según API 2.3)
    const base64Credentials = Buffer.from(`${login}:${secretKey}`).toString("base64");

    // Body según API 2.3
    const bodyRequest = {
      amount: amount,
      reference: reference,
      description: description,
      currency: "CLP",
      webpay: {
        callbackUrl: "https://entrealasyraices.cl/pago-exitoso.html"
      }
    };

    // Llamado a iniciar pago
    const response = await fetch(`${baseUrl}/webpay/v2.3/initiate-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${base64Credentials}`
      },
      body: JSON.stringify(bodyRequest)
    });

    const data = await response.json();

    // Si Getnet entrega processUrl → OK
    if (data.processUrl) {
      return res.status(200).json({
        ok: true,
        processUrl: data.processUrl
      });
    }

    // Si falla → mostrar detalle
    return res.status(400).json({
      ok: false,
      error: "Getnet rechazó la creación de la sesión",
      details: data
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Error interno",
      details: error.message
    });
  }
}

