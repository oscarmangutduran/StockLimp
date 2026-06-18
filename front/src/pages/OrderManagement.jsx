import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { orderService, productService } from '../services/api';
import Modal from '../components/Modal';
import { saveAs } from 'file-saver';
import axios from 'axios'; // Importamos axios directo para la petición del blob corporativo
import '../css/OrderManagement.css';

const OrderManagement = ({ user }) => {
    const activeUser = user || JSON.parse(localStorage.getItem('user'));

    // Intentar leer del contexto centralizado
    const context = useOutletContext();
    const ordersFromContext = context?.orders;
    const productsFromContext = context?.products;
    const loadOrdersFromContext = context?.loadOrders;
    const loadProductsFromContext = context?.loadProducts;

    const [orders, setOrders] = useState(ordersFromContext || []);
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(6);
    const [alertModal, setAlertModal] = useState({ isOpen: false, title: 'Atención', message: '' });
    const showAlert = (message, title = 'Atención') => {
        setAlertModal({ isOpen: true, title, message });
    };
    const [productsList, setProductsList] = useState(productsFromContext || []); 
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [selectedItems, setSelectedItems] = useState([{ id_producto: '', cantidad: 1 }]);

    // Estados para edición y eliminación de pedidos
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [orderToEdit, setOrderToEdit] = useState(null);
    const [editStatus, setEditStatus] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);

    // Sincronizar el estado local si el contexto cambia
    useEffect(() => {
        if (ordersFromContext) {
            setOrders(ordersFromContext);
        }
    }, [ordersFromContext]);

    useEffect(() => {
        if (productsFromContext) {
            setProductsList(productsFromContext);
        }
    }, [productsFromContext]);

    const loadOrders = async () => {
        if (loadOrdersFromContext) {
            await loadOrdersFromContext();
        } else {
            try {
                const res = await orderService.getAll();
                if (Array.isArray(res.data)) {
                    setOrders(res.data);
                }
            } catch (err) {
                console.error("Error al cargar pedidos:", err);
            }
        }
    };

    const loadProductsCatalog = async () => {
        if (loadProductsFromContext) {
            await loadProductsFromContext();
        } else {
            try {
                const res = await productService.getAll();
                if (Array.isArray(res.data)) {
                    setProductsList(res.data);
                }
            } catch (err) {
                console.error("Error al cargar catálogo:", err);
            }
        }
    };

    useEffect(() => {
        if (!ordersFromContext || !productsFromContext) {
            Promise.all([loadOrders(), loadProductsCatalog()]);
        }
    }, []);

    const handleOpenEditModal = (order) => {
        setOrderToEdit(order);
        setEditStatus(order.estado);
        setIsEditModalOpen(true);
    };

    const confirmDeleteOrder = (order) => {
        setOrderToDelete(order);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteOrder = async () => {
        if (!orderToDelete) return;
        try {
            const res = await orderService.delete(orderToDelete.id_pedido);
            if (res.data && res.data.success) {
                setIsDeleteModalOpen(false);
                loadOrders();
            } else {
                showAlert("No se pudo eliminar el pedido.", "Error");
            }
        } catch (err) {
            console.error("Error al eliminar pedido:", err);
            showAlert("Ocurrió un error al intentar eliminar el pedido.", "Error");
        }
    };

    const handleSaveStatus = async (e) => {
        e.preventDefault();
        if (!orderToEdit) return;
        try {
            const res = await orderService.updateStatus(orderToEdit.id_pedido, editStatus);
            if (res.data && res.data.success) {
                setIsEditModalOpen(false);
                loadOrders();
            } else {
                showAlert("No se pudo actualizar el estado.", "Error");
            }
        } catch (err) {
            console.error("Error al actualizar estado del pedido:", err);
            showAlert("Ocurrió un error al intentar actualizar el estado.", "Error");
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const d = new Date(dateStr);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
        } catch (e) {
            return dateStr;
        }
    };

    // FUNCIÓN CORREGIDA: Descarga binaria directa desde Laravel
    const handleExportExcel = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/pedidos/exportar', {
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            saveAs(blob, 'gestion_pedidos.xlsx');
        } catch (err) {
            console.error("Error al descargar el Excel de pedidos desde Laravel:", err);
            showAlert("No se pudo generar el listado Excel en este momento.", "Error de Exportación");
        }
    };

    const handleOpenCreateModal = () => {
        setSelectedItems([{ id_producto: '', cantidad: 1 }]);
        setIsModalOpen(true);
    };

    const handleAddItemField = () => {
        setSelectedItems([...selectedItems, { id_producto: '', cantidad: 1 }]);
    };

    const handleRemoveItemField = (index) => {
        setSelectedItems(selectedItems.filter((_, i) => i !== index));
    };

    const handleFieldChange = (index, field, value) => {
        const updated = [...selectedItems];
        updated[index][field] = value;
        setSelectedItems(updated);
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        const cleanProducts = selectedItems.filter(item => item.id_producto !== '');
        if (cleanProducts.length === 0) {
            showAlert("Debes seleccionar al menos un producto válido.", "Validación de Pedido");
            return;
        }

        try {
            const res = await orderService.createMultiple(activeUser?.id_user, cleanProducts);
            if (res.data && res.data.success) {
                setIsModalOpen(false);
                loadOrders();
            } else {
                showAlert("Error al procesar la inserción transaccional en el servidor.", "Error de Envío");
            }
        } catch (err) {
            console.error("Error al crear el pedido múltiple:", err);
        }
    };

    const handleStatusChange = async (id_pedido, newStatus, originalDate) => {
        try {
            const res = await orderService.updateStatus(id_pedido, newStatus, originalDate);
            if (res.data && res.data.success) {
                loadOrders();
            } else {
                showAlert("No se pudo actualizar el estado del pedido.", "Error de Actualización");
            }
        } catch (err) {
            console.error("Error al actualizar estado del pedido:", err);
        }
    };

    const handleOpenDetail = (order) => {
        setSelectedOrderDetails(order);
        setIsDetailOpen(true);
    };

    const filteredOrders = orders.filter(order => {
        const query = searchTerm.toLowerCase();
        return (
            order.id_pedido.toString().includes(query) ||
            order.operario.toLowerCase().includes(query) ||
            order.estado.toLowerCase().includes(query)
        );
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, recordsPerPage]);

    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredOrders.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredOrders.length / recordsPerPage);

    return (
        <div className="order-container">
            <div className="order-header">
                <h1 className="order-title">GESTIÓN DE PEDIDOS</h1>
                <div className="order-header-actions">
                    <button className="btn-excel-export" onClick={handleExportExcel}>
                        <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Excel</span>
                    </button>

                    <button className="btn-add-order" onClick={handleOpenCreateModal}>
                        <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Nuevo</span>
                    </button>

                    <div className="search-wrapper">
                        <input type="text" className="search-input" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </div>
            <div className="table-card">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>ID Pedido</th>
                            <th>Operario</th>
                            <th>Fecha de pedido</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRecords.map((order) => (
                            <tr key={order.id_pedido}>
                                <td className="cell-id"># {order.id_pedido}</td>
                                <td className="cell-operario">{order.operario}</td>
                                <td className="cell-date">{formatDateTime(order.fecha_pedido)}</td>
                                <td className="cell-status">
                                    <span className={`badge ${order.estado.toLowerCase()}`}>{order.estado}</span>
                                </td>
                                <td className="cell-actions">
                                    <div className="actions-wrapper">
                                        {(activeUser?.rol === 'super_admin' || activeUser?.rol === 'admin') && (
                                            <>
                                                <button 
                                                    className="action-btn btn-circle-edit" 
                                                    title="Editar" 
                                                    onClick={() => handleOpenEditModal(order)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    className="action-btn btn-circle-delete" 
                                                    title="Borrar" 
                                                    onClick={() => confirmDeleteOrder(order)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="3 6 5 6 21 6" />
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                        <line x1="10" y1="11" x2="10" y2="17" />
                                                        <line x1="14" y1="11" x2="14" y2="17" />
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {currentRecords.length === 0 && (
                            <tr>
                                <td colSpan="5" className="table-empty">
                                    No se encontraron pedidos registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Contenedor de la Paginación */}
            <div className="pagination-container">
                <div className="pagination-limit-selector">
                    <label htmlFor="limit-select">Registros por página:</label>
                    <select 
                        id="limit-select" 
                        value={recordsPerPage} 
                        onChange={(e) => setRecordsPerPage(Number(e.target.value))}
                        className="limit-dropdown"
                    >
                        <option value={3}>3</option>
                        <option value={6}>6</option>
                        <option value={9}>9</option>
                    </select>
                    <span className="pagination-info">
                        ({currentRecords.length} registros)
                    </span>
                </div>

                {totalPages > 1 && (
                    <div className="pagination-pages">
                        <button 
                            className="pagination-btn" 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                        <button 
                            className="pagination-btn" 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            <footer className="footer-container">
                <div className="footer-copyright">© 2026 StockLimp. Todos los derechos reservados.</div>
            </footer>

            {/* Modal Formulario */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Solicitud de Material">
                <form onSubmit={handleSubmitOrder}>
                    {selectedItems.map((item, index) => (
                        <div key={index} className="product-selection-row">
                            <select className="select-product-dropdown" value={item.id_producto} onChange={(e) => handleFieldChange(index, 'id_producto', e.target.value)} required>
                                <option value="">-- Selecciona un Producto --</option>
                                {productsList.map((prod) => (
                                    <option key={prod.id_producto} value={prod.id_producto}>{prod.nombre} (Stock: {prod.stock_actual})</option>
                                ))}
                            </select>
                            <input type="number" className="input-quantity" min="1" value={item.cantidad} onChange={(e) => handleFieldChange(index, 'cantidad', e.target.value)} required />
                            {selectedItems.length > 1 && (
                                <button type="button" className="btn-remove-item" onClick={() => handleRemoveItemField(index)}>&times;</button>
                            )}
                        </div>
                    ))}
                    <button type="button" className="btn-add-item-field" onClick={handleAddItemField}>+ Añadir otro producto</button>
                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                        <button type="submit" className="btn-submit" style={{ backgroundColor: '#10b981' }}>Enviar Solicitud</button>
                    </div>
                </form>
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

            {/* Modal de Edición de Pedido (Cambio de Estado) */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Modificar Estado de Pedido">
                {orderToEdit && (
                    <form onSubmit={handleSaveStatus}>
                        <div className="form-group" style={{ textAlign: 'left' }}>
                            <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block', color: 'var(--text-h)' }}>Estado del Pedido</label>
                            <select 
                                className="select-product-dropdown" 
                                value={editStatus} 
                                onChange={(e) => setEditStatus(e.target.value)} 
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}
                            >
                                <option value="PENDIENTE">PENDIENTE</option>
                                <option value="EN_PREPARACION">EN_PREPARACION</option>
                                <option value="DESPACHADO">DESPACHADO</option>
                                <option value="ENTREGADO">ENTREGADO</option>
                                <option value="CANCELADO">CANCELADO</option>
                            </select>
                        </div>
                        <div className="form-actions" style={{ marginTop: '24px' }}>
                            <button type="button" className="btn-cancel" onClick={() => setIsEditModalOpen(false)}>Cancelar</button>
                            <button type="submit" className="btn-submit">Actualizar Estado</button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal de Borrado de Pedido */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Eliminación de Pedido">
                {orderToDelete && (
                    <div>
                        <p style={{ marginBottom: '20px', fontSize: '14px', lineHeight: '1.6', textAlign: 'left', color: 'var(--text)' }}>
                            ¿Estás seguro de eliminar el pedido <strong>#{orderToDelete.id_pedido}</strong>? Esta acción es irreversible y eliminará todos los registros asociados a este pedido.
                        </p>
                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</button>
                            <button 
                                type="button" 
                                className="btn-submit" 
                                style={{ backgroundColor: 'var(--danger)' }} 
                                onClick={handleDeleteOrder}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default OrderManagement;