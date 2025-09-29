import React from 'react';

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={`modal ${className}`} onClick={handleBackdropClick}>
      <div className="modal-content">
        <span className="close-button" onClick={onClose}>&times;</span>
        <h3 className="modal-title">{title}</h3>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;