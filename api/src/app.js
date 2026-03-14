import express from 'express';
import cors from 'cors';
import machinesRoutes from './routes/machinesRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ message: 'API running' });
});

app.use('/api', machinesRoutes);

export default app;
