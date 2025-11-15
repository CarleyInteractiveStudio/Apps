import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint para obtener todos los juegos
app.get('/api/games', async (req, res) => {
  try {
    const dataDir = './data';
    const files = await fs.readdir(dataDir);
    const gamesData = [];

    for (const file of files) {
      if (path.extname(file) === '.json') {
        const filePath = path.join(dataDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        gamesData.push(JSON.parse(content));
      }
    }

    res.json(gamesData);
  } catch (err) {
    console.error('Error al leer los datos de los juegos:', err);
    res.status(500).send('Error en el servidor al obtener los datos de los juegos.');
  }
});

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.send('Servidor Creative Game funcionando!');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
