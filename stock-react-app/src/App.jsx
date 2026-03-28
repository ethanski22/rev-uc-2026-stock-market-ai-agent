import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {

  const [formData, setFormData] = useState({ stockSymbol: '' });
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
    const validSymbols = [
      'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'IBM', 'INTC'
    ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStockData(null);
    try {
      // Using Alpha Vantage demo API, replace 'demo' with your own API key for production
      const res = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${formData.stockSymbol}&apikey=demo`);
      const data = await res.json();
      if (data["Global Quote"] && data["Global Quote"]["01. symbol"]) {
        setStockData(data["Global Quote"]);
      } else {
        setError('No data found for this symbol.');
      }
    } catch (err) {
      setError('Error fetching stock data.');
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
            {new Date().toLocaleString()}
          </p>
        </div>
        <div>
            <form onSubmit={handleSubmit}>
              <label>
                Stock Symbol:
                <select
                  name="stockSymbol"
                  value={formData.stockSymbol}
                  onChange={handleChange}
                  required
                  style={{ marginLeft: '8px', marginRight: '8px' }}
                >
                  <option value="" disabled>Select a symbol</option>
                  {validSymbols.map(symbol => (
                    <option key={symbol} value={symbol}>{symbol}</option>
                  ))}
                </select>
                or enter manually:
                <input
                  type="text"
                  name="stockSymbol"
                  value={formData.stockSymbol}
                  onChange={handleChange}
                  placeholder="e.g. AAPL"
                  style={{ marginLeft: '8px' }}
                  required
                />
              </label>
              <br />
              <button type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Submit'}
              </button>
            </form>
          {error && <div style={{ color: 'red', marginTop: '8px' }}>{error}</div>}
          {loading && <div style={{ marginTop: '8px' }}>Loading...</div>}
          {stockData && (
            <div style={{ background: '#f8f8f8', padding: '16px', borderRadius: '8px', marginTop: '8px' }}>
              <h2>{stockData["01. symbol"]}</h2>
              <p><strong>Price:</strong> ${stockData["05. price"]}</p>
              <p><strong>Open:</strong> ${stockData["02. open"]}</p>
              <p><strong>High:</strong> ${stockData["03. high"]}</p>
              <p><strong>Low:</strong> ${stockData["04. low"]}</p>
              <p><strong>Previous Close:</strong> ${stockData["08. previous close"]}</p>
              <p><strong>Change:</strong> {stockData["09. change"]} ({stockData["10. change percent"]})</p>
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
