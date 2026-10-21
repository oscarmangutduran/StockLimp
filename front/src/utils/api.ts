import { Platform } from 'react-native';

/**
 * Obtiene el token de autenticación actual almacenado en la sesión
 */
export function getAuthToken(): string | null {
  if (Platform.OS !== 'web') return null;
  try {
    const directToken = sessionStorage.getItem('token');
    if (directToken) return directToken;

    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      return parsed.token || parsed.api_token || null;
    }
  } catch (e) {
    console.error('Error al obtener token de autenticación:', e);
  }
  return null;
}

/**
 * Genera cabeceras HTTP estándar incluyendo Authorization Bearer si el usuario está autenticado
 */
export function getAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Wrapper sobre fetch para inyectar automáticamente el Bearer token
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = getAuthHeaders((options.headers as Record<string, string>) || {});
  
  return fetch(url, {
    ...options,
    headers,
  });
}
