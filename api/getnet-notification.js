export default async function handler(req, res) {
  try {
    // Getnet siempre envía datos en POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método no permitido" });
    }

    // Capturamos lo que Getnet envía
    const notification = req.body;

    // Log interno en Vercel (puedes revisarlo en Logs)
    console.log("📥 Notificación de Getnet recibida:", notification);

    // Respuesta obligatoria para Getnet (si no, marcará error)
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error en notificación Getnet:", error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
