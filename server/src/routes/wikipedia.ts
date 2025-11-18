import express, { Request, Response } from 'express';
import { getWikipediaSummary, searchWikipedia } from '../services/wikipediaService';

const router = express.Router();

// Get Wikipedia summary for a topic
router.get('/summary/:title', async (req: Request, res: Response) => {
  try {
    const { title } = req.params;
    const { language = 'en' } = req.query;

    const summary = await getWikipediaSummary(title, language as string);

    if (!summary) {
      res.status(404).json({ error: 'Wikipedia article not found' });
      return;
    }

    res.json(summary);
  } catch (error) {
    console.error('Wikipedia summary error:', error);
    res.status(500).json({ error: 'Failed to fetch Wikipedia summary' });
  }
});

// Search Wikipedia
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, language = 'en', limit = '5' } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Search query required' });
      return;
    }

    const results = await searchWikipedia(q, language as string, parseInt(limit as string));
    res.json(results);
  } catch (error) {
    console.error('Wikipedia search error:', error);
    res.status(500).json({ error: 'Failed to search Wikipedia' });
  }
});

export default router;
