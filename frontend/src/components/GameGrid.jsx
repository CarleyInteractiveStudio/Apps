import React, { useState, useEffect } from 'react';
import GameCard from './GameCard';

// Vuelve a los datos de muestra para la depuración
const sampleGames = [
  {
    id: 1,
    nombre: 'Juego de Muestra 1',
    imagen_principal: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    // Añadimos datos completos para que el modal funcione
    creador: "Estudio Creativo",
    fecha_creacion: "2024-05-10",
    plataformas: ["PC", "Web"],
    disponibilidad: "Disponible ahora",
    descripcion: "Un juego de muestra para la depuración.",
    fotos_adicionales: []
  },
  {
    id: 2,
    nombre: 'Juego de Muestra 2',
    imagen_principal: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    creador: "Desarrollos Galácticos",
    fecha_creacion: "2024-08-22",
    plataformas: ["Móvil"],
    disponibilidad: "Próximamente",
    descripcion: "Otro juego de muestra para la depuración.",
    fotos_adicionales: []
  },
];

const GameGrid = ({ onGameSelect }) => {
  const [games, setGames] = useState([]);

  useEffect(() => {
    // Ya no hacemos fetch, solo usamos los datos de muestra.
    setGames(sampleGames);
  }, []);

  return (
    <div className="game-grid">
      {games.map((game) => (
        <GameCard key={game.id} game={game} onCardClick={onGameSelect} />
      ))}
    </div>
  );
};

export default GameGrid;
