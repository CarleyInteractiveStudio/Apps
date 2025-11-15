import React, { useState } from 'react';
import './App.css';
import GameGrid from './components/GameGrid';
import GameModal from './components/GameModal';

function App() {
  const [selectedGame, setSelectedGame] = useState(null);

  const handleGameSelect = (game) => {
    // Aquí necesitaríamos los detalles completos del juego,
    // que la API nos proporcionará más adelante.
    // Por ahora, usamos lo que tenemos.
    const fullGameDetails = {
      ...game,
      creador: "Creador de Muestra",
      fecha_creacion: "2024-01-01",
      plataformas: ["PC"],
      disponibilidad: "Disponible",
      descripcion: "Esta es una descripción de muestra para el juego.",
      fotos_adicionales: [],
    };
    setSelectedGame(fullGameDetails);
  };

  const handleCloseModal = () => {
    setSelectedGame(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Creative Game</h1>
        <p>Los juegos creados con Creative Engine</p>
      </header>
      <main>
        <GameGrid onGameSelect={handleGameSelect} />
      </main>
      <GameModal game={selectedGame} onClose={handleCloseModal} />
    </div>
  );
}

export default App;
