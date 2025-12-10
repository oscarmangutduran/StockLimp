// front/src/services/ProductService.js
import axios from 'axios';

// 🚨 URL CRÍTICA AJUSTADA a /stocklimp/back/ 🚨
const API_URL = 'http://localhost/stocklimp/back/index.php'; 

/**
 * Obtiene los datos de cualquier recurso (tabla) del backend.
 * @param {string} resourceName - El nombre de la tabla (ej: 'productos', 'users').
 * @returns {Promise} Una promesa que resuelve a la lista de datos o un objeto de error.
 */
export const fetchResourceData = async (resourceName) => {
    try {
        const response = await axios.get(API_URL, {
            params: {
                resource: resourceName // Usa el recurso dinámico
            }
        });
        
        return response.data; 
    } catch (error) {
        console.error(`Error al obtener datos del recurso ${resourceName}:`, error);
        // Devolvemos un objeto de error que el componente pueda interpretar.
        return { message: "Error de conexión de red o CORS." }; 
    }
};