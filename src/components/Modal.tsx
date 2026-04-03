import React from "react";

type Props = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const Modal = ({ title, open, onClose, children }: Props) => {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <strong>{title}</strong>
          <button className="ghost small" type="button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
