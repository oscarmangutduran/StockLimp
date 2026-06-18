<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Registro Rechazado - StockLimp</title>
</head>
<body style="font-family: sans-serif; color: #334155; line-height: 1.6; padding: 20px;">
    <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Solicitud de Registro - StockLimp</h2>
    <p>Hola {{ $user->nombre }},</p>
    <p>Te informamos que tu solicitud de alta en la plataforma StockLimp ha sido rechazada por el Super Administrador.</p>
    <p>Si consideras que esto es un error, por favor contacta con el administrador del sistema.</p>
    <footer style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 12px; color: #64748b;">
        © {{ date('Y') }} StockLimp. Todos los derechos reservados.
    </footer>
</body>
</html>
