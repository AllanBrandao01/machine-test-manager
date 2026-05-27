import express from 'express';
import cors from 'cors';
import machinesRoutes from './routes/machinesRoutes.js';
import shiftSessionRoutes from './routes/shiftSessionRoutes.js';

const app = express();

const allowedOrigin = process.env.ALLOWED_ORIGIN;

app.use(
  cors({
    origin: allowedOrigin || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ message: 'API running' });
});

app.use('/api', machinesRoutes);

app.use('/api/shift-session', shiftSessionRoutes);

export default app;
