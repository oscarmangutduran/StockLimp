import axios from 'axios';

// Instancia centralizada de Axios apuntando al puerto nativo de Laravel
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

// 1. Servicio de Autenticación
export const authService = {
    login: (email, password) => api.post('/usuarios/login', { email, password }),
};

// 2. Servicio de Almacén (Productos)
export const productService = {
    getAll: () => api.get('/productos'),
    create: (data) => api.post('/productos', data),
    update: (data) => api.post('/productos/update', data),
    delete: (id) => api.post('/productos/delete', { id }),
};

// 3. Servicio de Suministros y Logística (Pedidos)
export const orderService = {
    getAll: (params) => api.get('/pedidos', { params }),
    createMultiple: (id_user, productos, observaciones) => api.post('/pedidos/multiple', { id_user, productos, observaciones }),
    updateStatus: (id_pedido, estado, fecha_pedido) => api.post('/pedidos/update', { id_pedido, estado, fecha_pedido }),
    updateDetails: (id_pedido, id_user, productos, observaciones) => api.post('/pedidos/update-details', { id_pedido, id_user, productos, observaciones }),
    delete: (id) => api.post('/pedidos/delete', { id_pedido: id }),
};

// 4. Servicio de Infraestructura (Centros de Trabajo) 👈 ¡AQUÍ ESTÁ EL QUE FALTABA!
export const centerService = {
    getAll: () => api.get('/centros_trabajo'),
    create: (data) => api.post('/centros_trabajo', data),
    update: (data) => api.post('/centros_trabajo/update', data),
    delete: (id) => api.post('/centros_trabajo/delete', { id }),
};

// 5. Servicio de Usuarios (Super Administrador y Admin)
export const userService = {
    getAll: () => api.get('/usuarios'),
    updateRole: (id_user, rol) => api.post('/usuarios/update-role', { id_user, rol }),
    create: (data) => api.post('/usuarios', data),
    approve: (id_user) => api.post('/usuarios/aprobar', { id_user }),
    reject: (id_user) => api.post('/usuarios/rechazar', { id_user }),
    delete: (id_user) => api.post('/usuarios/delete', { id_user }),
    update: (data) => api.post('/usuarios/update', data),
    solicitarRestablecimiento: (email) => api.post('/usuarios/solicitar-restablecimiento', { email }),
    enviarRestablecimiento: (id_user) => api.post('/usuarios/enviar-restablecimiento', { id_user }),
    cambiarPasswordObligatorio: (id_user, password) => api.post('/usuarios/cambiar-password-obligatorio', { id_user, password }),
};

export default api;