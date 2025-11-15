import React from 'react';

const GameModal = ({ game, onClose }) => {
  if (!game) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2>{game.nombre}</h2>
        <img src={game.imagen_principal} alt={game.nombre} className="modal-main-image" />

        <div className="modal-details">
          <p><strong>Creador:</strong> {game.creador}</p>
          <p><strong>Fecha de Creación:</strong> {game.fecha_creacion}</p>
          <p><strong>Plataformas:</strong> {game.plataformas?.join(', ')}</p>
          <p><strong>Disponibilidad:</strong> {game.disponibilidad}</p>
          <p><strong>Descripción:</strong> {game.descripcion}</p>
        </div>

        <h3>Fotos Adicionales</h3>
        <div className="modal-additional-photos">
          {game.fotos_adicionales?.map((photo, index) => (
            <img key={index} src={photo} alt={`${game.nombre} - foto adicional ${index + 1}`} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameModal;
