import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import stockSymbols from './stockSymbols.json';


const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY;
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
      // Fetch quote from Financial Modeling Prep (new endpoint)
      const quoteRes = await fetch(`https://financialmodelingprep.com/stable/quote?symbol=${formData.stockSymbol}&apikey=${FMP_API_KEY}`);
      const quoteData = await quoteRes.json();
      if (quoteData && quoteData[0]) {
        setStockData(quoteData[0]);
      } else {
        setError('No data found for this symbol.');
        setLoading(false);
        return;
      }
      // Fetch company profile for name and logo (new endpoint)
      const profileRes = await fetch(`https://financialmodelingprep.com/stable/profile?symbol=${formData.stockSymbol}&apikey=${FMP_API_KEY}`);
      const profileData = await profileRes.json();
      if (profileData && profileData[0]) {
        setCompanyInfo(profileData[0]);
      } else {
        setCompanyInfo(null);
      }
    } catch (err) {
      setError('Error fetching stock/company data.');
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
            <div style={{ background: '#f8f8f8', padding: '16px', borderRadius: '8px', marginTop: '8px' }}>
              <h2>{stockData.symbol}</h2>
              {companyInfo && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  {companyInfo.image && (
                    <img src={companyInfo.image} alt={companyInfo.companyName} style={{ width: 40, height: 40, objectFit: 'contain', background: '#fff', borderRadius: '8px', border: '1px solid #eee' }} />
                  )}
                  <span style={{ fontWeight: 'bold', fontSize: '1.1em' }}>{companyInfo.companyName}</span>
                </div>
              )}
              <p><strong>Price:</strong> ${stockData.price}</p>
              <p><strong>Open:</strong> ${stockData.open}</p>
              <p><strong>High:</strong> ${stockData.dayHigh}</p>
              <p><strong>Low:</strong> ${stockData.dayLow}</p>
              <p><strong>Previous Close:</strong> ${stockData.previousClose}</p>
              <p><strong>Change:</strong> {stockData.change} ({stockData.changesPercentage}%)</p>
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
