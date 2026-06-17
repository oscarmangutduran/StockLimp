import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import Modal from '../components/Modal';
import { saveAs } from 'file-saver';
import axios from 'axios'; // Importamos axios directo para la petición del blob corporativo
import '../css/ProductManagement.css';

const ProductManagement = ({ user }) => {
    const activeUser = user || JSON.parse(localStorage.getItem('user'));
    const [products, setProducts] = useState([]);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: 'Atención', message: '' });
    const showAlert = (message, title = 'Atención') => {
        setAlertModal({ isOpen: true, title, message });
    };
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProductDetails, setSelectedProductDetails] = useState(null);
    const [productToDelete, setProductToDelete] = useState(null);
    const [currentProduct, setCurrentProduct] = useState(null); 

    const [formData, setFormData] = useState({
        nombre: '',
        sku: '',
        es_toxico: false,
        precio_unidad: '',
        stock_actual: ''
    });

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

    const getRegisterDate = (product) => {
        if (product.id_producto <= 3) {
            return '2026-05-18';
        }
        return product.fecha_registro || new Date().toISOString().split('T')[0];
    };

    // FUNCIÓN CORREGIDA: Descarga binaria directa desde Laravel
    const handleExportExcel = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/productos/exportar', {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            saveAs(blob, 'gestion_productos.xlsx');
        } catch (err) {
            console.error("Error al descargar el archivo Excel desde el servidor:", err);
            showAlert("No se pudo generar el reporte Excel en este momento.", "Error de Exportación");
        }
    };

    const handleOpenCreate = () => {
        setCurrentProduct(null);
        setFormData({ nombre: '', sku: '', es_toxico: false, precio_unidad: '', stock_actual: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (product) => {
        setCurrentProduct(product);
        setFormData({
            nombre: product.nombre,
            sku: product.sku || '',
            es_toxico: product.es_toxico == 1,
            precio_unidad: product.precio_unidad,
            stock_actual: product.stock_actual
        });
        setIsModalOpen(true);
    };

    const handleOpenDetail = (product) => {
        setSelectedProductDetails(product);
        setIsDetailOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                loadProducts();
            } else {
                showAlert("Error al intentar guardar el producto en el inventario.", "Error de Registro");
            }
        } catch (err) {
            console.error("Error en la solicitud de productos:", err);
        }
    };

    const confirmDelete = (product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const handleDelete = async (id) => {
        try {
            const res = await productService.delete(id);
            if (res.data && res.data.success) {
                setIsDeleteModalOpen(false);
                loadProducts();
            } else {
                showAlert("No se puede eliminar el producto debido a restricciones de clave foránea.", "Error de Eliminación");
            }
        } catch (err) {
            console.error("Error al eliminar producto:", err);
        }
    };

    const filteredProducts = products.filter(product => {
        const query = searchTerm.toLowerCase();
        return (
            product.id_producto.toString().includes(query) ||
            product.nombre.toLowerCase().includes(query) ||
            (product.sku && product.sku.toLowerCase().includes(query))
        );
    });

    return (
        <div className="product-container">
            <div className="product-header">
                <h1 className="product-title">GESTIÓN DE PRODUCTOS</h1>
                <div className="product-header-actions">
                    <button className="btn-excel-export" onClick={handleExportExcel}>
                        <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Excel</span>
                    </button>

                    {activeUser?.rol === 'admin' && (
                        <button className="btn-add-product" onClick={handleOpenCreate}>
                            <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>Nuevo</span>
                        </button>
                    )}

                    <div className="search-wrapper">
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="table-card">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>ID Producto</th>
                            <th>Nombre</th>
                            <th>SKU</th>
                            <th>¿Tóxico?</th>
                            <th>Precio Unidad</th>
                            <th>Stock Actual</th>
                            <th>Fecha de registro</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id_producto}>
                                <td className="cell-id">{product.id_producto}</td>
                                <td className="cell-nombre">{product.nombre}</td>
                                <td className="cell-sku">{product.sku || 'N/A'}</td>
                                <td className="cell-toxic">{product.es_toxico == 1 ? 'SÍ' : 'NO'}</td>
                                <td className="cell-price">{parseFloat(product.precio_unidad).toFixed(2)}€</td>
                                <td className="cell-stock">{parseFloat(product.stock_actual).toFixed(2)}</td>
                                <td className="cell-date">{getRegisterDate(product)}</td>
                                <td className="cell-actions">
                                    <div className="actions-wrapper">
                                        <button className="action-btn btn-circle-info" title="Detalles" onClick={() => handleOpenDetail(product)}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                            </svg>
                                        </button>

                                        {activeUser?.rol === 'admin' && (
                                            <>
                                                <button className="action-btn btn-circle-edit" title="Editar" onClick={() => handleOpenEdit(product)}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <button className="action-btn btn-circle-delete" title="Borrar" onClick={() => confirmDelete(product)}>
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" />
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <footer className="footer-container">
                <div className="footer-copyright">© 2026 StockLimp. Todos los derechos reservados.</div>
            </footer>

            {/* Modal de Formulario */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentProduct ? 'Modificar Parámetros de Producto' : 'Ingresar Nuevo Producto al Stock'}>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre Comercial</label>
                        <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Código SKU</label>
                        <input type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} placeholder="Ej: LIMP-LEJIA-01" />
                    </div>
                    <div className="form-group">
                        <label>Precio por Unidad (€)</label>
                        <input type="number" step="0.01" value={formData.precio_unidad} onChange={(e) => setFormData({ ...formData, precio_unidad: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label>Cantidad de Entrada de Stock</label>
                        <input type="number" step="1" value={formData.stock_actual} onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })} required />
                    </div>
                    <div className="form-group checkbox-group">
                        <input type="checkbox" id="es_toxico_check" checked={formData.es_toxico} onChange={(e) => setFormData({ ...formData, es_toxico: e.target.checked })} />
                        <label htmlFor="es_toxico_check" style={{ fontWeight: '700', color: '#dc2626' }}>¿Requiere etiquetado tóxico?</label>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-submit">{currentProduct ? 'Actualizar Ficha' : 'Dar de Alta'}</button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Info */}
            <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Detalles del Producto">
                {selectedProductDetails && (
                    <div className="detail-card-container">
                        <div className="detail-grid">
                            <div className="detail-grid-item"><span className="grid-label">PRODUCTO</span><span className="grid-value">{selectedProductDetails.nombre}</span></div>
                            <div className="detail-grid-item"><span className="grid-label">STOCK</span><span className="grid-value">{selectedProductDetails.stock_actual} uds.</span></div>
                        </div>
                        <div className="form-actions" style={{ marginTop: '20px' }}>
                            <button type="button" className="btn-submit" onClick={() => setIsDetailOpen(false)}>Cerrar</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal de Borrado */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Eliminación">
                {productToDelete && (
                    <div>
                        <p>¿Estás seguro de eliminar <strong>{productToDelete.nombre}</strong>?</p>
                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
                            <button type="button" className="btn-submit" style={{ backgroundColor: 'var(--danger)' }} onClick={() => handleDelete(productToDelete.id_producto)}>Eliminar</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal de Alerta */}
            <Modal isOpen={alertModal.isOpen} onClose={() => setAlertModal({ ...alertModal, isOpen: false })} title={alertModal.title}>
                <div style={{ textAlign: 'left', padding: '10px 0' }}>
                    <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text)' }}>
                        {alertModal.message}
                    </p>
                    <div className="form-actions" style={{ marginTop: '24px' }}>
                        <button type="button" className="btn-submit" onClick={() => setAlertModal({ ...alertModal, isOpen: false })}>
                            Aceptar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProductManagement;