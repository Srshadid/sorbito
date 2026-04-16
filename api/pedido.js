export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, correo, telefono, direccion, cantidad } = req.body;

  if (!correo || !telefono || !direccion || !orderId) {
    return res.status(400).json({ success: false, error: 'Faltan campos requeridos' });
  }

  const fecha = new Date().toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    dateStyle: 'long',
    timeStyle: 'short',
  });

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#100E0B;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 32px;background:#1C1812;border:1px solid rgba(240,208,80,0.15);">

    <!-- Header -->
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#F0D050;opacity:0.7;">Nuevo pedido</p>
    <h1 style="margin:0 0 32px;font-size:28px;font-weight:700;letter-spacing:6px;color:#F0D050;">${orderId}</h1>

    <!-- Datos -->
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(240,208,80,0.1);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#cdc6c0;width:120px;">Correo</td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(240,208,80,0.1);font-size:15px;color:#F2E8D2;">${correo}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(240,208,80,0.1);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#cdc6c0;">Teléfono</td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(240,208,80,0.1);font-size:15px;color:#F2E8D2;">${telefono}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(240,208,80,0.1);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#cdc6c0;">Dirección</td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(240,208,80,0.1);font-size:15px;color:#F2E8D2;">${direccion}</td>
      </tr>
      <tr>
        <td style="padding:12px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#cdc6c0;">Cantidad</td>
        <td style="padding:12px 0;font-size:15px;font-weight:700;color:#F0D050;">${cantidad}</td>
      </tr>
    </table>

    <!-- Footer -->
    <p style="margin:32px 0 0;font-size:11px;color:#cdc6c0;opacity:0.5;letter-spacing:1px;">
      Sorbito · ${fecha}
    </p>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Sorbito Pedidos <pedidos@sorbito.club>',
        to: ['contacto@sorbito.club'],
        subject: `🫘 Pedido ${orderId} — Sorbito`,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Resend error:', error);
      return res.status(500).json({ success: false, error: 'Error al enviar el correo' });
    }

    // Registrar en Google Sheets (fire & forget)
    const fecha = new Date().toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
      dateStyle: 'short',
      timeStyle: 'short',
    });
    fetch(process.env.SHEETS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, fecha, correo, telefono, direccion, cantidad }),
    }).catch(e => console.error('Sheets error:', e));

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ success: false, error: 'Error del servidor' });
  }
}
