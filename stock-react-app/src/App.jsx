import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import stockSymbols from './stockSymbols.json';


function App() {

  const[dateTime, setDateTime] = useState(new Date().toLocaleString());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const [formData, setFormData] = useState({ stockSymbol: '' });
  const [stockData, setStockData] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStockData(null);
    setCompanyInfo(null);
    try {
      // Fetch analysis from local Python script via backend
      const res = await fetch(`http://localhost:3001/api/stock/${formData.stockSymbol}`);
      const data = await res.json();
      if (res.ok) {
        setStockData(data);
      } else {
        setError(data.error || 'Error fetching stock analysis.');
        setLoading(false);
        return;
      }
    } catch (err) {
      setError('Error fetching stock analysis.');
    }
    setLoading(false);
  };

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Welcome to MJE Money Manager</h1>
          <p>
            The Smart AI Stock Portfolio Helper
          </p>
          <p className="dateTime">
            It is currently {dateTime}
          </p>
        </div>
        <div>
            <form onSubmit={handleSubmit}>
              <label>
                Stock Symbol:
                <input
                  type="text"
                  name="stockSymbol"
                  value={formData.stockSymbol}
                  onChange={handleChange}
                  placeholder="e.g. AAPL"
                  list="stock-symbols"
                  style={{ marginLeft: '8px' }}
                  required
                />
                <datalist id="stock-symbols">
                  {stockSymbols.map(symbol => (
                    <option key={symbol} value={symbol} />
                  ))}
                </datalist>
              </label>
              <br />
              <button type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Submit'}
              </button>
            </form>
          {error && <div style={{ color: 'red', marginTop: '8px' }}>{error}</div>}
          {loading && <div style={{ marginTop: '8px' }}>Loading...</div>}
          {stockData && (
            <div className='results'>
              <h2>{stockData.ticker}</h2>
              <h2><strong>{stockData.signal}</strong></h2>
              <p><strong>Probabilities:</strong></p>
              <ul>
                <li>Buy: {stockData.probabilities.buy}%</li>
                <li>Hold: {stockData.probabilities.hold}%</li>
                <li>Sell: {stockData.probabilities.sell}%</li>
              </ul>
              <p><strong>Indicators:</strong></p>
              <ul>
                <li>RSI: {stockData.indicators.rsi.toFixed(2)}</li>
                <li>SMA 20: {stockData.indicators.sma_20.toFixed(2)}</li>
                <li>SMA 50: {stockData.indicators.sma_50.toFixed(2)}</li>
              </ul>
              <p><strong>Sentiment:</strong> {stockData.sentiment}</p>
              <p><strong>Reasons:</strong></p>
              <ul>
                {stockData.reasons.map((reason, index) => (
                  <li key={index}>{reason}</li>
                ))}
              </ul>
              {/* <p><strong>AI Explanation:</strong></p>
              <p>{stockData.ai_explanation}</p> */}
            </div>
          )}
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  );
}

export default App;
