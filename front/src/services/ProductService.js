import axios from 'axios';

/**
 * Forzamos el adaptador de XHR (navegador) para evitar 
 * errores de módulos de Node.js (http/https) en Webpack 5.
 */
const API = axios.create({
    baseURL: 'http://localhost/stocklimp/back/index.php',
    adapter: 'xhr' // 🚨 ESTA LÍNEA ES LA SOLUCIÓN
});

export const fetchResourceData = async (resource) => {
    try {
        const { data } = await API.get('', {
            params: { resource }
        });
        return data;
    } catch (err) {
        console.error(`[API Error]:`, err.message);
        return { error: true, message: "Error de conexión." };
    }
};