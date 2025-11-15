import React, { useState, useEffect } from 'react';
import GameCard from './GameCard';

const GameGrid = ({ onGameSelect }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await fetch('/api/games');
        if (!response.ok) {
          throw new Error('No se pudo obtener la lista de juegos.');
        }
        const data = await response.json();
        setGames(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  if (loading) return <p>Cargando juegos...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="game-grid">
      {games.map((game) => (
        <GameCard key={game.id} game={game} onCardClick={onGameSelect} />
      ))}
    </div>
  );
};

export default GameGrid;
