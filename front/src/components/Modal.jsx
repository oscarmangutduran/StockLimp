import React from 'react';
import '../css/Modal.css';

const Modal = ({ isOpen, onClose, title, children }) => {
    // Si el modal está cerrado, no renderizamos absolutamente nada en el DOM
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            {/* El stopPropagation evita que el modal se cierre al hacer clic dentro del formulario */}
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                
                {/* Cabecera del Modal */}
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>

                {/* Cuerpo dinámico (Aquí se inyectarán los formularios de productos, pedidos, etc.) */}
                <div className="modal-body">
                    {children}
                </div>

            </div>
        </div>
    );
};

export default Modal;