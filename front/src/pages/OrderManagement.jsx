import React, { useState, useEffect } from 'react';
import { orderService, productService } from '../services/api';
import Modal from '../components/Modal';
import '../css/OrderManagement.css';

const OrderManagement = ({ user }) => {
    const [orders, setOrders] = useState([]);
    const [productsList, setProductsList] = useState([]); // Lista para el dropdown del modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Array de productos que el usuario va añadiendo al pedido actual
    const [selectedItems, setSelectedItems] = useState([{ id_producto: '', cantidad: 1 }]);

    // Cargar historial de pedidos
    const loadOrders = async () => {
        try {
            const res = await orderService.getAll();
            if (Array.isArray(res.data)) {
                setOrders(res.data);
            }
        } catch (err) {
            console.error("Error al cargar pedidos:", err);
        }
    };

    // Cargar catálogo de productos para el formulario de selección rápida
    const loadProductsCatalog = async () => {
        try {
            const res = await productService.getAll();
            if (Array.isArray(res.data)) {
                setProductsList(res.data);
            }
        } catch (err) {
            console.error("Error al cargar catálogo de productos:", err);
        }
    };

    useEffect(() => {
        loadOrders();
        loadProductsCatalog();
    }, []);

    // Abrir modal e inicializar con una fila en blanco
    const handleOpenCreateModal = () => {
        setSelectedItems([{ id_producto: '', cantidad: 1 }]);
        setIsModalOpen(true);
    };

    // Añadir una nueva fila vacía en el formulario dinámico de productos
    const handleAddItemField = () => {
        setSelectedItems([...selectedItems, { id_producto: '', cantidad: 1 }]);
    };

    // Eliminar una fila específica del formulario
    const handleRemoveItemField = (index) => {
        const updated = selectedItems.filter((_, i) => i !== index);
        setSelectedItems(updated);
    };

    // Controlar los cambios dentro de una fila del formulario dinámico
    const handleFieldChange = (index, field, value) => {
        const updated = [...selectedItems];
        updated[index][field] = value;
        setSelectedItems(updated);
    };

    // Enviar el pedido múltiple al backend en formato relacional estructurado
    const handleSubmitOrder = async (e) => {
        e.preventDefault();

        // Validación preventiva: filtrar elementos que no tengan un producto seleccionado
        const cleanProducts = selectedItems.filter(item => item.id_producto !== '');
        if (cleanProducts.length === 0) {
            alert("Debes seleccionar al menos un producto válido.");
            return;
        }

        try {
            const res = await orderService.createMultiple(user?.id_user, cleanProducts);
            if (res.data && res.data.success) {
                setIsModalOpen(false);
                loadOrders(); // Recarga síncrona
            } else {
                alert("Error al procesar la inserción transaccional en el servidor.");
            }
        } catch (err) {
            console.error("Error al crear el pedido múltiple:", err);
        }
    };

    // Cambiar el estado de un pedido (Exclusivo Administrador)
    const handleStatusChange = async (id_pedido, newStatus, originalDate) => {
        try {
            const res = await orderService.updateStatus(id_pedido, newStatus, originalDate);
            if (res.data && res.data.success) {
                loadOrders();
            } else {
                alert("No se pudo actualizar el estado del pedido.");
            }
        } catch (err) {
            console.error("Error al actualizar estado del pedido:", err);
        }
    };

    return (
        <div className="order-container">
            <div className="order-header">
                <h2 className="order-title">Gestión de Pedidos de Suministros</h2>
                <button className="btn-add-order" onClick={handleOpenCreateModal}>
                    + Crear Nuevo Pedido
                </button>
            </div>

            <div className="table-container">
                <table className="center-table">
                    <thead>
                        <tr>
                            <th>ID Pedido</th>
                            <th>Operario Solicitante</th>
                            <th>Fecha Pedido</th>
                            <th>Estado Actual</th>
                            {user?.rol === 'admin' && <th>Acciones de Control</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id_pedido}>
                                <td># {order.id_pedido}</td>
                                <td><strong>{order.operario}</strong></td>
                                <td>{new Date(order.fecha_pedido).toLocaleString()}</td>
                                <td>
                                    <span className={`badge ${order.estado.toLowerCase()}`}>
                                        {order.estado}
                                    </span>
                                </td>
                                {user?.rol === 'admin' && (
                                    <td>
                                        <select 
                                            className="select-status"
                                            value={order.estado}
                                            onChange={(e) => handleStatusChange(order.id_pedido, e.target.value, order.fecha_pedido)}
                                        >
                                            <option value="PENDIENTE">Pendiente</option>
                                            <option value="COMPLETADO">Completado</option>
                                            <option value="CANCELADO">Cancelado</option>
                                        </select>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr>
                                <td colSpan={user?.rol === 'admin' ? 5 : 4} style={{ textAlign: 'center', padding: '24px' }}>
                                    No se han registrado transacciones de pedidos en el sistema.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal para la Creación Dinámica de un Pedido Múltiple */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Nueva Solicitud de Material"
            >
                <form onSubmit={handleSubmitOrder}>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                        Selecciona los productos químicos o utensilios que necesitas reponer y su respectiva cantidad.
                    </p>

                    {selectedItems.map((item, index) => (
                        <div key={index} className="product-selection-row">
                            <select
                                className="select-product-dropdown"
                                value={item.id_producto}
                                onChange={(e) => handleFieldChange(index, 'id_producto', e.target.value)}
                                required
                            >
                                <option value="">-- Selecciona un Producto --</option>
                                {productsList.map((prod) => (
                                    <option key={prod.id_producto} value={prod.id_producto}>
                                        {prod.nombre} (Stock actual: {prod.stock_actual})
                                    </option>
                                ))}
                            </select>

                            <input
                                type="number"
                                className="input-quantity"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => handleFieldChange(index, 'cantidad', e.target.value)}
                                required
                            />

                            {selectedItems.length > 1 && (
                                <button
                                    type="button"
                                    className="btn-remove-item"
                                    onClick={() => handleRemoveItemField(index)}
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    ))}

                    <button
                        type="button"
                        className="btn-add-item-field"
                        onClick={handleAddItemField}
                    >
                        + Añadir otro producto al pedido
                    </button>

                    <div className="form-actions">
                        <button type="button" className="btn-edit" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit" style={{ backgroundColor: '#10b981' }}>
                            Enviar Solicitud
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default OrderManagement;