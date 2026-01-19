import axios from 'axios';

/**
 * Configuración de la API local
 * Se usa localhost para evitar conflictos de origen con el dev server de Vite
 */
const API = axios.create({
    baseURL: 'http://localhost/stocklimp/back/index.php'
});

export const fetchResourceData = async (resource) => {
    try {
        const { data } = await API.get('', {
            params: { resource }
        });
        
        return data;
    } catch (err) {
        // Log para depuración interna
        console.error(`[API Error] Fail fetching ${resource}:`, err.message);
        
        // Devolvemos un objeto estructurado para que el front no rompa
        return { 
            error: true, 
            message: "No se pudo conectar con el servicio. Verifique el backend." 
        };
    }
};