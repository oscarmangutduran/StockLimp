import axios from 'axios';

// Creamos la instancia centralizada de Axios apuntando al servidor de desarrollo de Laravel
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * Servicio centralizado para Autenticación de Usuarios
 */
export const authService = {
    login: async (email, password) => {
        // Enrutamiento limpio hacia el UserController de Laravel
        return api.post('/usuarios/login', { email, password });
    }
};

/**
 * Servicio centralizado para Gestión del Almacén (Productos)
 */
export const productService = {
    getAll: async () => {
        return api.get('/productos');
    },
    create: async (productData) => {
        return api.post('/productos', productData);
    },
    update: async (productData) => {
        // Laravel recibe el body con el id_producto y actualiza usando Eloquent
        return api.post('/productos/update', productData);
    },
    delete: async (id_producto) => {
        // Mantenemos la estructura de enviar un objeto con { id } para no alterar la lógica visual de tus botones
        return api.post('/productos/delete', { id: id_producto });
    }
};

/**
 * Servicio centralizado para Logística y Suministros (Pedidos)
 */
export const orderService = {
    getAll: async () => {
        return api.get('/pedidos');
    },
    createMultiple: async (id_user, productsArray) => {
        return api.post('/pedidos/multiple', { id_user, productos: productsArray });
    },
    updateStatus: async (id_pedido, newStatus, originalDate) => {
        return api.post('/pedidos/update', { id_pedido, estado: newStatus, fecha_pedido: originalDate });
    }
};

/**
 * Servicio centralizado para Infraestructura (Centros de Trabajo)
 */
export const centerService = {
    getAll: async () => {
        return api.get('/centros_trabajo');
    },
    create: async (centerData) => {
        return api.post('/centros_trabajo', centerData);
    },
    update: async (centerData) => {
        return api.post('/centros_trabajo/update', centerData);
    },
    delete: async (id_centro) => {
        return api.post('/centros_trabajo/delete', { id: id_centro });
    }
};

// Exportamos la instancia base por si en algún componente necesitas hacer una petición personalizada
export default api;