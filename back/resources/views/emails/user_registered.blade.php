<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Registro en StockLimp</title>
</head>
<body style="font-family: sans-serif; color: #334155; line-height: 1.6; padding: 20px;">
    <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">¡Bienvenido a StockLimp, {{ $user->nombre }}!</h2>
    <p>Un administrador te ha registrado en la plataforma.</p>
    <p><strong>Detalles de tu cuenta:</strong></p>
    <ul>
        <li><strong>Email:</strong> {{ $user->email }}</li>
        <li><strong>Rol solicitado:</strong> {{ ucfirst($user->rol) }}</li>
        <li><strong>Contraseña temporal:</strong> {{ $password }}</li>
    </ul>
    <p style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 12px; color: #c2410c; font-weight: bold; border-radius: 4px;">
        Tu cuenta está actualmente pendiente de aprobación por el Super Administrador. Recibirás otro correo cuando sea activada.
    </p>
    <footer style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 12px; color: #64748b;">
        © {{ date('Y') }} StockLimp. Todos los derechos reservados.
    </footer>
</body>
</html>
