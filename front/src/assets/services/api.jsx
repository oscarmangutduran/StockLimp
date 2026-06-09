import axios from 'axios';

// Creamos la instancia centralizada de Axios apuntando al index de tu XAMPP
const api = axios.create({
    baseURL: 'http://localhost/StockLimp/back/index.php',
    headers: {
        'Content-Type': 'application/json'
    }
});

/**
 * Servicio centralizado para Autenticación de Usuarios
 */
export const authService = {
    login: async (email, password) => {
        // Realiza la petición POST directa al controlador híbrido PHP
        return api.post('?resource=usuarios&action=login', { email, password });
    }
};

/**
 * Servicio centralizado para Gestión del Almacén (Productos)
 */
export const productService = {
    getAll: async () => {
        return api.get('?resource=productos');
    },
    create: async (productData) => {
        return api.post('?resource=productos&action=create', productData);
    },
    update: async (productData) => {
        return api.post('?resource=productos&action=update', productData);
    },
    delete: async (id_producto) => {
        return api.post('?resource=productos&action=delete', { id: id_producto, column: 'id_producto' });
    }
};

/**
 * Servicio centralizado para Logística y Suministros (Pedidos)
 */
export const orderService = {
    getAll: async () => {
        return api.get('?resource=pedidos');
    },
    createMultiple: async (id_user, productsArray) => {
        return api.post('?resource=pedidos&action=create_pedido_multiple', { id_user, productos: productsArray });
    },
    updateStatus: async (id_pedido, newStatus, originalDate) => {
        return api.post('?resource=pedidos&action=update', { id_pedido, estado: newStatus, fecha_pedido: originalDate });
    }
};

/**
 * Servicio centralizado para Infraestructura (Centros de Trabajo)
 */
export const centerService = {
    getAll: async () => {
        return api.get('?resource=centros_trabajo');
    },
    create: async (centerData) => {
        return api.post('?resource=centros_trabajo&action=create', centerData);
    },
    update: async (centerData) => {
        return api.post('?resource=centros_trabajo&action=update', centerData);
    },
    delete: async (id_centro) => {
        return api.post('?resource=centros_trabajo&action=delete', { id: id_centro, column: 'id_centro' });
    }
};

// Exportamos la instancia base por si en algún componente necesitas hacer una petición personalizada
export default api;