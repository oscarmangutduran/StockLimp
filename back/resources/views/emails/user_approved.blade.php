<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Cuenta Aprobada - StockLimp</title>
</head>
<body style="font-family: sans-serif; color: #334155; line-height: 1.6; padding: 20px;">
    <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">¡Tu cuenta ha sido aprobada, {{ $user->nombre }}!</h2>
    <p>El Super Administrador ha aprobado tu registro en la plataforma.</p>
    <p>Ya puedes acceder y empezar a gestionar tus tareas.</p>
    <div style="margin-top: 24px; margin-bottom: 24px;">
        <a href="http://localhost:5173" style="background-color: #5e8c89; color: white; padding: 10px 20px; text-decoration: none; border-radius: 20px; font-weight: bold;">Acceder a StockLimp</a>
    </div>
    <footer style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 12px; color: #64748b;">
        © {{ date('Y') }} StockLimp. Todos los derechos reservados.
    </footer>
</body>
</html>
