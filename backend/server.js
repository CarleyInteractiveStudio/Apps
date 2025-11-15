import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Determina el directorio actual de una manera robusta para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint para obtener todos los juegos
app.get('/api/games', async (req, res) => {
  try {
    // Usa una ruta absoluta a la carpeta 'data'
    const dataDir = path.join(__dirname, 'data');
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
