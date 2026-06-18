<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Restablecimiento de Contraseña - StockLimp</title>
</head>
<body style="font-family: sans-serif; color: #334155; line-height: 1.6; padding: 20px;">
    <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">¡Restablecimiento de Contraseña, {{ $user->nombre }}!</h2>
    <p>El Super Administrador ha restablecido tu contraseña a petición tuya.</p>
    <p><strong>Tus nuevas credenciales de acceso son:</strong></p>
    <ul>
        <li><strong>Email:</strong> {{ $user->email }}</li>
        <li><strong>Nueva Contraseña Temporal:</strong> {{ $password }}</li>
    </ul>
    <p style="background-color: #fff7ed; border-left: 4px solid #ea580c; padding: 12px; color: #c2410c; font-weight: bold; border-radius: 4px;">
        Te recomendamos cambiar esta contraseña en cuanto inicies sesión por motivos de seguridad.
    </p>
    <div style="margin-top: 24px; margin-bottom: 24px;">
        <a href="http://localhost:5173" style="background-color: #5e8c89; color: white; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-weight: bold;">Acceder a StockLimp</a>
    </div>
    <footer style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 12px; color: #64748b;">
        © {{ date('Y') }} StockLimp. Todos los derechos reservados.
    </footer>
</body>
</html>
