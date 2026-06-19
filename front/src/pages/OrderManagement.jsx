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
    
    const [isUserOrderModalOpen, setIsUserOrderModalOpen] = useState(false);
    const [userCart, setUserCart] = useState({});
    
    // Estados adicionales para la modificación de pedidos por parte de operarios
    const [editingOrder, setEditingOrder] = useState(null);
    const [forcePeriod, setForcePeriod] = useState(false);
    const [userObservations, setUserObservations] = useState('');
    const [adminObservations, setAdminObservations] = useState('');
    
    // Determinar si hoy está en el periodo del 2 al 8 del mes
    const todayDay = new Date().getDate();
    const canModify = (todayDay >= 2 && todayDay <= 8) || forcePeriod;

    const handleOpenUserOrderModal = () => {
        setEditingOrder(null);
        setUserCart({});
        setUserObservations('');
        setIsUserOrderModalOpen(true);
    };

    const handleIncrementCart = (id_producto) => {
        setUserCart(prev => ({
            ...prev,
            [id_producto]: (prev[id_producto] || 0) + 1
        }));
    };

    const handleDecrementCart = (id_producto) => {
        setUserCart(prev => {
            const current = prev[id_producto] || 0;
            if (current <= 1) {
                const updated = { ...prev };
                delete updated[id_producto];
                return updated;
            }
            return {
                ...prev,
                [id_producto]: current - 1
            };
        });
    };

    const handleClearCartItem = (id_producto) => {
        setUserCart(prev => {
            const updated = { ...prev };
            delete updated[id_producto];
            return updated;
        });
    };

    const handleSubmitUserOrder = async () => {
        const cleanProducts = Object.keys(userCart)
            .filter(id => userCart[id] > 0)
            .map(id => ({
                id_producto: parseInt(id),
                cantidad: userCart[id]
            }));

        if (cleanProducts.length === 0) {
            showAlert("Debes seleccionar al menos un producto haciendo clic en su imagen.", "Pedido vacío");
            return;
        }

        try {
            let res;
            if (editingOrder) {
                res = await orderService.updateDetails(editingOrder.id_pedido, activeUser?.id_user, cleanProducts, userObservations, forcePeriod);
            } else {
                res = await orderService.createMultiple(activeUser?.id_user, cleanProducts, userObservations);
            }

            if (res.data && res.data.success) {
                setIsUserOrderModalOpen(false);
                setEditingOrder(null);
                setUserCart({});
                setUserObservations('');
                showAlert(
                    editingOrder ? "Tu pedido se ha modificado correctamente." : "Tu pedido se ha registrado correctamente.",
                    editingOrder ? "Pedido Modificado" : "Pedido Completado"
                );
                loadOrders();
            } else {
                showAlert("Error al procesar el pedido en el servidor.", "Error");
            }
        } catch (err) {
            console.error("Error al enviar el pedido del usuario:", err);
            showAlert("Ocurrió un error al enviar el pedido.", "Error");
        }
    };

    const handleOpenEditUserOrder = (order) => {
        setEditingOrder(order);
        const cart = {};
        if (order.detalles) {
            order.detalles.forEach(d => {
                cart[d.id_producto] = Math.round(d.cantidad_solicitada);
            });
        }
        setUserCart(cart);
        setUserObservations(order.observaciones || '');
        setIsUserOrderModalOpen(true);
    };

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
    const handleExportExcel = () => {
        window.location.href = 'http://127.0.0.1:8000/api/pedidos/exportar';
    };

    const handleOpenCreateModal = () => {
        setSelectedItems([{ id_producto: '', cantidad: 1 }]);
        setAdminObservations('');
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
            const res = await orderService.createMultiple(activeUser?.id_user, cleanProducts, adminObservations);
            if (res.data && res.data.success) {
                setIsModalOpen(false);
                setAdminObservations('');
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

    const renderUserOrderModal = () => {
        return (
            <Modal 
                isOpen={isUserOrderModalOpen} 
                onClose={() => setIsUserOrderModalOpen(false)} 
                title="Seleccionar Productos para el Pedido"
            >
                <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                    <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '16px', textAlign: 'left', lineHeight: '1.5' }}>
                        Haz clic en la imagen de los productos que deseas pedir. Cada clic incrementará la cantidad en 1.
                    </p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px'
                    }}>
                        {productsList.map((prod) => {
                            const qty = userCart[prod.id_producto] || 0;
                            return (
                                <div 
                                    key={prod.id_producto}
                                    style={{
                                        border: qty > 0 ? '2px solid var(--accent)' : '1px solid var(--border)',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        textAlign: 'center',
                                        position: 'relative',
                                        backgroundColor: qty > 0 ? 'rgba(94, 140, 137, 0.03)' : '#ffffff',
                                        boxShadow: qty > 0 ? '0 4px 12px rgba(94, 140, 137, 0.1)' : 'none',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer',
                                        userSelect: 'none'
                                    }}
                                    onClick={() => handleIncrementCart(prod.id_producto)}
                                    className="hover-scale-img"
                                >
                                    {/* Cantidad seleccionada (badge flotante) */}
                                    {qty > 0 && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            right: '-8px',
                                            backgroundColor: 'var(--accent)',
                                            color: '#ffffff',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                            zIndex: 10
                                        }}>
                                            {qty}
                                        </div>
                                    )}

                                    {/* Contenedor de la Imagen */}
                                    <div style={{
                                        width: '100%',
                                        height: '90px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        marginBottom: '8px',
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <img 
                                            src={`/images/${prod.imagen || 'detergente.png'}`} 
                                            alt={prod.nombre} 
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                                e.target.onerror = null; 
                                                e.target.src = '/images/detergente.png';
                                            }}
                                        />
                                    </div>

                                    {/* Nombre del Producto */}
                                    <div style={{
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        color: 'var(--text-h)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        marginBottom: '4px'
                                    }} title={prod.nombre}>
                                        {prod.nombre}
                                    </div>

                                    {/* Stock y Precio */}
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#64748b',
                                        marginBottom: '8px'
                                    }}>
                                        Stock: {Math.round(prod.stock_actual)} | {parseFloat(prod.precio_unidad).toFixed(2)}€
                                    </div>

                                    {/* Controles de decremento/borrado si ya está seleccionado */}
                                    {qty > 0 && (
                                        <div 
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                marginTop: '8px'
                                            }}
                                            onClick={(e) => e.stopPropagation()} // Evitar incrementar al hacer clic en los controles
                                        >
                                            <button 
                                                type="button" 
                                                style={{
                                                    backgroundColor: '#f1f5f9',
                                                    color: '#334155',
                                                    border: '1px solid var(--border)',
                                                    borderRadius: '4px',
                                                    padding: '2px 8px',
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    fontWeight: '700',
                                                    lineHeight: '1'
                                                }}
                                                onClick={() => handleDecrementCart(prod.id_producto)}
                                                title="Reducir cantidad"
                                            >
                                                -
                                            </button>
                                            <button 
                                                type="button" 
                                                style={{
                                                    backgroundColor: 'rgba(220, 38, 38, 0.08)',
                                                    color: '#dc2626',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '2px 6px',
                                                    fontSize: '11px',
                                                    cursor: 'pointer',
                                                    fontWeight: '600'
                                                }}
                                                onClick={() => handleClearCartItem(prod.id_producto)}
                                                title="Quitar producto"
                                            >
                                                Quitar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Campo de observaciones */}
                <div style={{ marginTop: '16px', marginBottom: '16px', textAlign: 'left' }}>
                    <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '6px', color: 'var(--text-h)' }}>
                        Observaciones / Anotaciones
                    </label>
                    <textarea
                        placeholder="Escribe aquí alguna anotación sobre el pedido..."
                        value={userObservations}
                        onChange={(e) => setUserObservations(e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: '60px',
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            fontSize: '13px',
                            fontFamily: 'var(--sans)',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Footer del Modal con Resumen */}
                <div style={{
                    borderTop: '1px solid var(--border)',
                    paddingTop: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                }}>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-h)' }}>
                            Resumen de Pedido
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {Object.values(userCart).reduce((a, b) => a + b, 0)} artículos seleccionados
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            type="button" 
                            className="btn-cancel" 
                            onClick={() => setIsUserOrderModalOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="button" 
                            className="btn-submit" 
                            style={{ 
                                backgroundColor: '#10b981', 
                                color: '#ffffff', 
                                border: 'none', 
                                padding: '10px 20px', 
                                borderRadius: '6px', 
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                            onClick={handleSubmitUserOrder}
                        >
                            Confirmar Pedido
                        </button>
                    </div>
                </div>
            </Modal>
        );
    };

    return (
        <div className="order-container">
            <div className="order-header">
                <h1 className="order-title">{activeUser?.rol === 'usuario' ? 'MIS PEDIDOS' : 'GESTIÓN DE PEDIDOS'}</h1>
                <div className="order-header-actions">
                    {(activeUser?.rol === 'super_admin' || activeUser?.rol === 'admin') && (
                        <button className="btn-excel-export" onClick={handleExportExcel}>
                            <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Excel</span>
                        </button>
                    )}

                    <button className="btn-add-order" onClick={activeUser?.rol === 'usuario' ? handleOpenUserOrderModal : handleOpenCreateModal}>
                        <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>{activeUser?.rol === 'usuario' ? 'Nuevo Pedido' : 'Nuevo'}</span>
                    </button>

                    <div className="search-wrapper">
                        <input type="text" className="search-input" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
            </div>

            {activeUser?.rol === 'usuario' && (
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#eff6ff',
                    color: '#1e40af',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    border: '1px solid #bfdbfe',
                    marginBottom: '16px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                        </svg>
                        <span>Nota: Puedes modificar tus pedidos del día 2 al 8 de cada mes. Estado actual: <strong>{canModify ? "HABILITADO" : "DESHABILITADO"}</strong>.</span>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12.5px', color: '#1e3a8a' }}>
                        <input type="checkbox" checked={forcePeriod} onChange={(e) => setForcePeriod(e.target.checked)} />
                        Simular periodo activo (para pruebas)
                    </label>
                </div>
            )}

            <div className="table-card">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>ID Pedido</th>
                            {activeUser?.rol !== 'usuario' && <th>Operario</th>}
                            <th>Productos Pedidos</th>
                            <th>Fecha de pedido</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRecords.map((order) => (
                            <tr key={order.id_pedido}>
                                <td className="cell-id"># {order.id_pedido}</td>
                                {activeUser?.rol !== 'usuario' && <td className="cell-operario">{order.operario}</td>}
                                <td className="cell-productos" style={{ maxWidth: '250px' }}>
                                    <div style={{ fontWeight: '600', color: 'var(--accent)' }}>
                                        {order.detalles ? order.detalles.reduce((sum, item) => sum + parseInt(item.cantidad_solicitada || 0), 0) : 0} uds.
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={order.detalles && order.detalles.map(d => `${d.producto?.nombre || 'Producto'} (x${d.cantidad_solicitada})`).join(', ')}>
                                        {order.detalles && order.detalles.map(d => `${d.producto?.nombre || 'Producto'} (x${d.cantidad_solicitada})`).join(', ')}
                                    </div>
                                </td>
                                <td className="cell-date">{formatDateTime(order.fecha_creacion || order.fecha_pedido)}</td>
                                <td className="cell-status">
                                    <span className={`badge ${order.estado.toLowerCase()}`}>{order.estado}</span>
                                </td>
                                <td className="cell-actions">
                                    <div className="actions-wrapper">
                                        {(activeUser?.rol === 'super_admin' || activeUser?.rol === 'admin') && (
                                            <>
                                                <button 
                                                    className="action-btn btn-circle-info" 
                                                    title="Detalles" 
                                                    onClick={() => handleOpenDetail(order)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                                    </svg>
                                                </button>
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
                                        {activeUser?.rol === 'usuario' && (
                                            <>
                                                <button 
                                                    className="action-btn btn-circle-info" 
                                                    title="Detalles" 
                                                    onClick={() => handleOpenDetail(order)}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                                    </svg>
                                                </button>
                                                <button 
                                                    className={`action-btn btn-circle-edit ${!canModify ? 'disabled' : ''}`}
                                                    title={canModify ? "Modificar Pedido" : "Modificación solo del 2 al 8 del mes"} 
                                                    onClick={() => {
                                                        if (canModify) {
                                                            handleOpenEditUserOrder(order);
                                                        } else {
                                                            showAlert("Solo se pueden modificar los pedidos entre los días 2 y 8 del mes en curso.", "Fecha fuera de rango");
                                                        }
                                                    }}
                                                    style={{
                                                        opacity: canModify ? 1 : 0.5,
                                                        cursor: canModify ? 'pointer' : 'not-allowed'
                                                    }}
                                                >
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
                                <td colSpan={activeUser?.rol === 'usuario' ? 5 : 6} className="table-empty">
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

                    {/* Campo de observaciones */}
                    <div style={{ marginTop: '16px', marginBottom: '16px', textAlign: 'left' }}>
                        <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '6px', color: 'var(--text-h)' }}>
                            Observaciones / Anotaciones
                        </label>
                        <textarea
                            placeholder="Escribe aquí alguna anotación sobre el pedido..."
                            value={adminObservations}
                            onChange={(e) => setAdminObservations(e.target.value)}
                            style={{
                                width: '100%',
                                minHeight: '60px',
                                padding: '10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                fontSize: '13px',
                                fontFamily: 'var(--sans)',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

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

            {/* Modal de Pedido para Usuario */}
            {renderUserOrderModal()}

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

            {/* Modal de Detalles de Pedido */}
            <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`Detalles de Pedido #${selectedOrderDetails?.id_pedido}`}>
                {selectedOrderDetails && (
                    <div className="detail-card-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Operario</div>
                                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-h)' }}>{selectedOrderDetails.operario}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Estado</div>
                                <span className={`badge ${selectedOrderDetails.estado.toLowerCase()}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                                    {selectedOrderDetails.estado}
                                </span>
                            </div>
                        </div>

                        {selectedOrderDetails.observaciones && (
                            <div style={{ textAlign: 'left', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '4px' }}>Observaciones</div>
                                <div style={{ fontSize: '13.5px', color: 'var(--text-h)', whiteSpace: 'pre-wrap' }}>{selectedOrderDetails.observaciones}</div>
                            </div>
                        )}

                        <div style={{ textAlign: 'left', marginBottom: '16px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px' }}>Productos en el Pedido</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {selectedOrderDetails.detalles && selectedOrderDetails.detalles.map((d, index) => (
                                    <div key={index} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '10px',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <img 
                                            src={`/images/${d.producto?.imagen || 'detergente.png'}`} 
                                            alt={d.producto?.nombre} 
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                objectFit: 'cover',
                                                borderRadius: '6px',
                                                marginRight: '12px',
                                                border: '1px solid var(--border)',
                                                backgroundColor: '#fff'
                                            }}
                                            onError={(e) => {
                                                e.target.onerror = null; 
                                                e.target.src = '/images/detergente.png';
                                            }}
                                        />
                                        <div style={{ flexGrow: 1 }}>
                                            <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-h)' }}>
                                                {d.producto?.nombre || 'Producto'}
                                            </div>
                                            <div style={{ fontSize: '12.5px', color: 'var(--accent)', fontWeight: '700', marginTop: '3px' }}>
                                                Cantidad: {Math.round(d.cantidad_solicitada)} uds.
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-actions" style={{ marginTop: '24px', paddingBottom: 0 }}>
                            <button type="button" className="btn-submit" onClick={() => setIsDetailOpen(false)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default OrderManagement;