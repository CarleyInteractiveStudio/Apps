import React, { useState } from 'react';
import './App.css';
import GameGrid from './components/GameGrid';
import GameModal from './components/GameModal';

function App() {
  const [selectedGame, setSelectedGame] = useState(null);

  // Esta función ahora simplemente pasa el objeto 'game' completo al estado.
  // La información ya viene completa desde la API a través de GameGrid.
  const handleGameSelect = (game) => {
    setSelectedGame(game);
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
