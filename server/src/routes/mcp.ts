import { Router } from 'express';
import { streamChat, summarizeTitle } from '../controllers/mcp';

const router = Router();

router.post('/', streamChat);
router.post('/Tsummarize', summarizeTitle);

export default router;
