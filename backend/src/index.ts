// Entry point for the Forgesworn Hearth backend server.
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { connectToDb } from './db/mongo';
import { generateNarration } from './llm/llmClient';
import oracleRoutes from './routes/oracles';
import moveRoutes from './routes/moves';
import campaignRoutes from './routes/campaigns';
import generatorRoutes from './routes/generators';

config({ path: '../.env.development' });

const PORT = Number(process.env.PORT) || 3000;

async function startServer(): Promise<void> {
  try {
    await connectToDb();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }

  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      env: process.env.NODE_ENV,
    });
  });

  app.get('/api/test-llm', async (_req, res) => {
    const prompt = 'Write two short sentences describing an eerie but not dangerous forest scene.';
    try {
      const narration = await generateNarration(prompt);
      res.json({ response: narration });
    } catch (error) {
      console.error('LLM request failed:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.use('/api/oracles', oracleRoutes);
  app.use('/api/moves', moveRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/api/generators', generatorRoutes);

  app.listen(PORT, () => {
    console.log(`Forgesworn Hearth backend running on port ${PORT}`);
  });
}

void startServer();
