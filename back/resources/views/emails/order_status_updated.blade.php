<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Actualización de Pedido - StockLimp</title>
</head>
<body style="font-family: sans-serif; color: #334155; line-height: 1.6; padding: 20px;">
    <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Tu pedido ha cambiado de estado</h2>
    <p>Hola {{ $order->usuario->nombre }},</p>
    <p>Te informamos que tu pedido <strong>#{{ $order->id_pedido }}</strong> ha sido actualizado a:</p>
    <div style="margin: 16px 0; display: inline-block; background-color: #f1f5f9; padding: 8px 16px; border-radius: 6px; font-weight: bold; border-left: 4px solid #5e8c89; text-transform: uppercase;">
        {{ $order->estado }}
    </div>
    <p><strong>Centro de Trabajo de referencia:</strong> {{ $order->centro ? $order->centro->nombre : 'Sin especificar' }}</p>
    <p>Puedes verificar los detalles de tu pedido accediendo al sistema.</p>
    <div style="margin-top: 24px; margin-bottom: 24px;">
        <a href="http://localhost:5173" style="background-color: #5e8c89; color: white; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-weight: bold;">Acceder a StockLimp</a>
    </div>
    <footer style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 12px; color: #64748b;">
        © {{ date('Y') }} StockLimp. Todos los derechos reservados.
    </footer>
</body>
</html>
