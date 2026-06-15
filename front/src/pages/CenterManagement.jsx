import React, { useState, useEffect } from 'react';
import { centerService } from '../services/api';
import Modal from '../components/Modal';
import '../css/CenterManagement.css';

const CenterManagement = ({ user }) => {
    const [centers, setCenters] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentCenter, setCurrentCenter] = useState(null); // null = Crear, objeto = Editar
    const [formData, setFormData] = useState({ nombre: '', direccion: '', ciudad: '' });

    // Cargar los centros de trabajo desde la base de datos
    const loadCenters = async () => {
        try {
            const res = await centerService.getAll();
            if (Array.isArray(res.data)) {
                setCenters(res.data);
            }
        } catch (err) {
            console.error("Error al cargar centros de trabajo:", err);
        }
    };

    useEffect(() => {
        loadCenters();
    }, []);

    // Abrir modal en modo creación
    const handleOpenCreate = () => {
        setCurrentCenter(null);
        setFormData({ nombre: '', direccion: '', ciudad: '' });
        setIsModalOpen(true);
    };

    // Abrir modal en modo edición
    const handleOpenEdit = (center) => {
        setCurrentCenter(center);
        setFormData({
            nombre: center.nombre,
            direccion: center.direccion || '',
            ciudad: center.ciudad || ''
        });
        setIsModalOpen(true);
    };

    // Procesar envío del formulario (Crear o Actualizar)
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Estructuramos la acción según lo que espera el router de PHP
        const action = currentCenter ? 'update' : 'create';
        const payload = currentCenter 
            ? { ...formData, id_centro: currentCenter.id_centro } 
            : formData;

        try {
            const res = currentCenter 
                ? await centerService.update(payload) 
                : await centerService.create(payload);
            if (res.data && res.data.success) {
                setIsModalOpen(false);
                loadCenters(); // Refrescar la tabla automáticamente
            } else {
                alert("Ocurrió un error en el servidor al guardar el centro.");
            }
        } catch (err) {
            console.error("Error en la petición:", err);
        }
    };

    // Borrar un registro de centro de trabajo
    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar este centro de trabajo de forma permanente?")) return;

        try {
            const res = await centerService.delete(id);
            if (res.data && res.data.success) {
                loadCenters();
            } else {
                alert("No se pudo eliminar el registro. Comprueba la integridad referencial.");
            }
        } catch (err) {
            console.error("Error al eliminar centro:", err);
        }
    };

    return (
        <div className="center-container">
            <div className="center-header">
                <h2 className="center-title">Gestión de Centros de Trabajo</h2>
                {user?.rol === 'admin' && (
                    <button className="btn-add-center" onClick={handleOpenCreate}>
                        + Añadir Centro
                    </button>
                )}
            </div>

            <div className="table-container">
                <table className="center-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre del Centro</th>
                            <th>Dirección</th>
                            <th>Ciudad</th>
                            <th>Fecha Registro</th>
                            {user?.rol === 'admin' && <th>Acciones</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {centers.map((center) => (
                            <tr key={center.id_centro}>
                                <td>{center.id_centro}</td>
                                <td><strong>{center.nombre}</strong></td>
                                <td>{center.direccion || 'N/A'}</td>
                                <td>{center.ciudad || 'N/A'}</td>
                                <td>{new Date(center.fecha_registro).toLocaleDateString()}</td>
                                {user?.rol === 'admin' && (
                                    <td className="actions-cell">
                                        <button className="btn-edit" onClick={() => handleOpenEdit(center)}>
                                            Editar
                                        </button>
                                        <button className="btn-delete" onClick={() => handleDelete(center.id_centro)}>
                                            Borrar
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {centers.length === 0 && (
                            <tr>
                                <td colSpan={user?.rol === 'admin' ? 6 : 5} style={{ textAlign: 'center', padding: '24px' }}>
                                    No hay centros de trabajo registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Invocación del componente Modal reutilizable */}
            <Modal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                title={currentCenter ? 'Editar Centro de Trabajo' : 'Añadir Nuevo Centro'}
            >
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre del Centro</label>
                        <input 
                            type="text" 
                            value={formData.nombre}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Dirección</label>
                        <input 
                            type="text" 
                            value={formData.direccion}
                            onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Ciudad</label>
                        <input 
                            type="text" 
                            value={formData.ciudad}
                            onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                        />
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn-edit" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit">
                            {currentCenter ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CenterManagement;