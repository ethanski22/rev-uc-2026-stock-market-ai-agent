# rev-uc-2026-stock-market-ai-agent
Revolution UC 2026 Project - Stock Market AI Agent

A model/system that takes a stock → analyzes patterns/signals → returns insights to the user

A system that analyzes stock patterns and signals to provide explainable buy/sell recommendations with confidence scoring.


User inputs stock

→ Backend fetches data
→ Signal engine computes indicators
→ Scoring system decides signal

→ LLM (Featherless):
     turns data → explanation

→ Frontend displays:
     chart + signal + explanation

// Instructions
In VSC:
a.
     1. Open a new terminal
     2. Navigate to ...\stock-react-app (cd stock-react-app)
     3. npm install
     4. npm run dev
     5. Note the localhost URL stated in the terminal
b.
     1. Open another new terminal
     2. Navigate to ...\stock-react-app (cd stock-react-app)
     3. npm run server
c. 
     1. Go to the localhost URL from step a-5 in your browser
     2. Select a stock
     3. Submit
     4. Observe results