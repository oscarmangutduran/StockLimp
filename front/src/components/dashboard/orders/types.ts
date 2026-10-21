export interface OrderDetail {
  id_detalle: number;
  id_pedido: number;
  id_producto: number;
  cantidad_solicitada: number;
  precio_total_linea: number;
  producto?: {
    nombre: string;
    precio_unidad: number;
  };
}

export interface Order {
  id_pedido: number;
  id_user: number;
  id_centro: number;
  fecha_creacion: string;
  estado: string;
  observaciones?: string;
  operario: string;
  numero_ruta?: string;
  detalles: OrderDetail[];
  usuario?: {
    nombre: string;
    email: string;
  };
  centro?: {
    nombre: string;
  };
}

export interface Center {
  id_centro: number;
  nombre: string;
  direccion?: string;
  ciudad?: string;
  numero_ruta?: number;
}

export interface User {
  id_user: number;
  nombre: string;
  rol: string;
  id_centro?: number | null;
  centro?: Center;
  centros?: Center[];
  assigned_centros?: Center[];
}

export interface Product {
  id_producto: number;
  nombre: string;
  precio_unidad: number;
  es_toxico?: boolean | number;
}

export interface FormItem {
  id_producto: number;
  cantidad: number;
}

export interface OrdersViewProps {
  baseUrl: string;
  userRole?: string;
  userId?: number;
  idCentro?: number | null;
  currentUser?: any;
}
