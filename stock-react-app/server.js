import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/stock/:ticker', (req, res) => {
  const ticker = req.params.ticker.toUpperCase();

  console.log('__dirname:', __dirname);
  const scriptPath = 'c:/RevUC/rev-uc-2026-stock-market-ai-agent/stock-react-app/stockAnalysis.py';
  console.log('scriptPath:', scriptPath);
  console.log('executing:', `python c:/RevUC/rev-uc-2026-stock-market-ai-agent/stock-react-app/stockAnalysis.py ${ticker}`);
  exec(`python c:/RevUC/rev-uc-2026-stock-market-ai-agent/stock-react-app/stockAnalysis.py ${ticker}`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: 'Failed to run analysis', details: stderr });
    }
    try {
      const result = JSON.parse(stdout);
      res.json(result);
    } catch (parseError) {
      res.status(500).json({ error: 'Failed to parse analysis result', details: parseError.message });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});