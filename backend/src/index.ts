import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import chatRouter from './routes/chat';

// Load .env before anything else
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// ── Security headers ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || !isProd) {
      return callback(null, true);
    }
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Request logging ───────────────────────────────────────────────────────
app.use(morgan(isProd ? 'combined' : 'dev'));

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '100kb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),   // 1 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '30'),         // 30 req/min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a moment before trying again.' },
  skip: () => !isProd,   // skip rate limiting in development
});

app.use('/api/chat', chatLimiter);

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api', chatRouter);

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    openaiConfigured: !!process.env.OPENAI_API_KEY,
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({
    error: isProd ? 'Internal server error' : err.message,
  });
});

// ── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 AI Persona Chat backend`);
  console.log(`   Mode    : ${isProd ? 'production' : 'development'}`);
  console.log(`   URL     : http://localhost:${PORT}`);
  console.log(`   Health  : http://localhost:${PORT}/health`);
  console.log(`   Personas: http://localhost:${PORT}/api/personas\n`);

  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not set — chat will not work');
    console.warn('   Add it to backend/.env\n');
  }
});

export default app;
