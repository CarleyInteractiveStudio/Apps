import React from 'react';

const GameCard = ({ game, onCardClick }) => {
  return (
    <div className="game-card" onClick={() => onCardClick(game)}>
      <img src={game.imagen_principal} alt={game.nombre} className="game-card-image" />
      <h3 className="game-card-title">{game.nombre}</h3>
      <button className="game-card-button">Probar</button>
    </div>
  );
};

export default GameCard;
