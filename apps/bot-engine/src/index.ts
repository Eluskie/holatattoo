import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { whatsappRouter } from './routes/whatsapp';
import { healthRouter } from './routes/health';
import { logVersion } from './version';

dotenv.config();

// Log version on startup
logVersion();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRouter);
app.use('/webhook/whatsapp', whatsappRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Only start server if not in serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Bot Engine running on port ${PORT}`);
    console.log(`📱 WhatsApp webhook: http://localhost:${PORT}/webhook/whatsapp`);
    console.log(`🔗 Meta webhook URL: https://your-domain.com/webhook/whatsapp`);
  });
}

// Export for Vercel serverless
export default app;
