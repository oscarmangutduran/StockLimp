// front/src/services/ProductService.js
import axios from 'axios';

// 🚨 CRÍTICO: Usamos localhost para que coincida con el Origen de React 🚨
const API_URL = 'http://localhost/stocklimp/back/index.php'; 

export const fetchResourceData = async (resourceName) => {
    try {
        const response = await axios.get(API_URL, {
            params: {
                resource: resourceName 
            }
        });
        
        return response.data; 
    } catch (error) {
        console.error(`Error al obtener datos del recurso ${resourceName}:`, error);
        return { message: "Error de conexión de red o CORS." }; 
    }
};