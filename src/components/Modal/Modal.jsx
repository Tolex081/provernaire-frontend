// frontend/src/components/Modal/Modal.jsx
import React from 'react';
import './Modal.css'; // Import the CSS for the Modal

/**
 * Modal Component
 * A reusable modal dialog for displaying messages (e.g., alerts, confirmations).
 * @param {boolean} show - Controls the visibility of the modal.
 * @param {string} message - The message to display inside the modal.
 * @param {function} onClose - Callback function to close the modal.
 */
const Modal = ({ show, message, onClose }) => {
  if (!show) {
    return null; // Don't render if not visible
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <p className="modal-message">{message}</p>
        <button onClick={onClose} className="modal-close-button">
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;
