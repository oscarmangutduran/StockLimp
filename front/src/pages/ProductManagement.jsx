import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import Modal from '../components/Modal';
import '../css/ProductManagement.css';

const ProductManagement = ({ user }) => {
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null); // null = Crear, objeto = Editar
    
    // Estado inicial para el formulario
    const [formData, setFormData] = useState({
        nombre: '',
        sku: '',
        es_toxico: false,
        precio_unidad: '',
        stock_actual: ''
    });

    // Obtener catálogo completo de productos
    const loadProducts = async () => {
        try {
            const res = await productService.getAll();
            if (Array.isArray(res.data)) {
                setProducts(res.data);
            }
        } catch (err) {
            console.error("Error al cargar productos:", err);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    // Lanzar modal para insertar nuevo producto
    const handleOpenCreate = () => {
        setCurrentProduct(null);
        setFormData({ nombre: '', sku: '', es_toxico: false, precio_unidad: '', stock_actual: '' });
        setIsModalOpen(true);
    };

    // Lanzar modal cargando los datos del producto a modificar
    const handleOpenEdit = (product) => {
        setCurrentProduct(product);
        setFormData({
            nombre: product.nombre,
            sku: product.sku || '',
            es_toxico: product.es_toxico == 1 ? true : false,
            precio_unidad: product.precio_unidad,
            stock_actual: product.stock_actual
        });
        setIsModalOpen(true);
    };

    // Procesar inserción o actualización
    const handleSubmit = async (e) => {
        e.preventDefault();

        const action = currentProduct ? 'update' : 'create';
        
        // Mapeamos el payload adaptando el booleano al entero que procesa el Modelo PHP
        const payload = {
            ...formData,
            es_toxico: formData.es_toxico ? 1 : 0,
            precio_unidad: parseFloat(formData.precio_unidad),
            stock_actual: parseFloat(formData.stock_actual)
        };

        if (currentProduct) {
            payload.id_producto = currentProduct.id_producto;
        }

        try {
            const res = currentProduct
                ? await productService.update(payload)
                : await productService.create(payload);
            if (res.data && res.data.success) {
                setIsModalOpen(false);
                loadProducts(); // Recarga limpia del catálogo
            } else {
                alert("Error al intentar guardar el producto en el inventario.");
            }
        } catch (err) {
            console.error("Error en la solicitud de productos:", err);
        }
    };

    // Eliminar producto del inventario
    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás completamente seguro de eliminar este producto? Podría afectar al histórico de pedidos.")) return;

        try {
            const res = await productService.delete(id);
            if (res.data && res.data.success) {
                loadProducts();
            } else {
                alert("No se puede eliminar el producto debido a restricciones de clave foránea.");
            }
        } catch (err) {
            console.error("Error al eliminar producto:", err);
        }
    };

    return (
        <div className="product-container">
            <div className="product-header">
                <h2 className="product-title">Control de Inventario y Almacén</h2>
                {user?.rol === 'admin' && (
                    <button className="btn-add-product" onClick={handleOpenCreate}>
                        + Añadir Producto
                    </button>
                )}
            </div>

            <div className="table-container">
                <table className="center-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre Producto</th>
                            <th>SKU / Código</th>
                            <th>Estado Químico</th>
                            <th>Precio Unitario</th>
                            <th>Stock Disponible</th>
                            {user?.rol === 'admin' && <th>Acciones de Almacén</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id_producto}>
                                <td>{product.id_producto}</td>
                                <td><strong>{product.nombre}</strong></td>
                                <td><code>{product.sku || 'N/A'}</code></td>
                                <td>
                                    <span className={product.es_toxico == 1 ? "badge-toxic" : "badge-safe"}>
                                        {product.es_toxico == 1 ? "⚠️ Tóxico" : "Seguro"}
                                    </span>
                                </td>
                                <td>{parseFloat(product.precio_unidad).toFixed(2)} €</td>
                                <td>
                                    {/* Alerta visual interactiva si el stock baja de 5 unidades */}
                                    <span className={parseFloat(product.stock_actual) <= 5 ? "stock-low" : ""}>
                                        {product.stock_actual} uds.
                                    </span>
                                </td>
                                {user?.rol === 'admin' && (
                                    <td className="actions-cell">
                                        <button className="btn-edit" onClick={() => handleOpenEdit(product)}>
                                            Editar
                                        </button>
                                        <button className="btn-delete" onClick={() => handleDelete(product.id_producto)}>
                                            Borrar
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={user?.rol === 'admin' ? 7 : 6} style={{ textAlign: 'center', padding: '24px' }}>
                                    No hay existencias registradas en el almacén.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Reutilizable para la Gestión Física del Producto */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={currentProduct ? 'Modificar Parámetros de Producto' : 'Ingresar Nuevo Producto al Stock'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre Comercial</label>
                        <input 
                            type="text" 
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Código SKU</label>
                        <input 
                            type="text" 
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            placeholder="Ej: LIMP-LEJIA-01"
                        />
                    </div>
                    <div className="form-group">
                        <label>Precio por Unidad (€)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={formData.precio_unidad}
                            onChange={(e) => setFormData({ ...formData, precio_unidad: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Cantidad de Entrada de Stock</label>
                        <input 
                            type="number" 
                            step="1"
                            value={formData.stock_actual}
                            onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group checkbox-group">
                        <input 
                            type="checkbox" 
                            id="es_toxico_check"
                            checked={formData.es_toxico}
                            onChange={(e) => setFormData({ ...formData, es_toxico: e.target.checked })}
                        />
                        <label htmlFor="es_toxico_check" style={{ fontWeight: '700', color: '#dc2626' }}>
                            ¿Este producto requiere etiquetado de peligro por toxicidad?
                        </label>
                    </div>
                    
                    <div className="form-actions">
                        <button type="button" className="btn-edit" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit">
                            {currentProduct ? 'Actualizar Ficha' : 'Dar de Alta'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProductManagement;