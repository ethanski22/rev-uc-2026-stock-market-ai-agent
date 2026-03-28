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
      // Fetch company profile for name and logo
      const profileRes = await fetch(`https://financialmodelingprep.com/stable/profile?symbol=${formData.stockSymbol}&apikey=${FMP_API_KEY}`);
      const profileData = await profileRes.json();
      if (profileData && profileData[0]) {
        setCompanyInfo(profileData[0]);
      } else {
        setCompanyInfo(null);
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
                <h3>Stock Symbol: </h3>
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
              <p></p>
              <button type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Submit'}
              </button>
            </form>
          <br />
          {error && <div style={{ color: 'red', marginTop: '8px' }}>{error}</div>}
          {loading && <div style={{ marginTop: '8px' }}>Loading...</div>}
          {stockData && (
            <div className='results' style={{ textAlign: 'center' }}>
              {companyInfo ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {companyInfo.image && (
                    <img src={companyInfo.image} alt={companyInfo.companyName} style={{ width: 100, height: 100, objectFit: 'contain'}} />
                  )}
                  <h1 style={{ margin: 0 }}>{companyInfo.companyName}</h1>
                </div>
              ) : (
                <h1>{stockData.ticker}</h1>
              )}
              <br />
              <h2>
                <strong
                  style={{
                    color:
                      stockData.signal === 'BUY'
                        ? 'green'
                        : stockData.signal === 'SELL'
                        ? 'red'
                        : 'goldenrod'
                  }}
                >
                  {stockData.signal}
                </strong>
              </h2>
              <br />
              <h2>Probabilities:</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(100px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                <div style={{ background: '#e6ffed', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #a3e5b5' }}>
                  <div style={{ fontWeight: 'bold', color: 'green' }}>BUY</div>
                  <div>{stockData.probabilities.buy}%</div>
                </div>
                <div style={{ background: '#fff9db', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #f7de7d' }}>
                  <div style={{ fontWeight: 'bold', color: 'goldenrod' }}>HOLD</div>
                  <div>{stockData.probabilities.hold}%</div>
                </div>
                <div style={{ background: '#ffe7e7', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #e5a6a6' }}>
                  <div style={{ fontWeight: 'bold', color: 'red' }}>SELL</div>
                  <div>{stockData.probabilities.sell}%</div>
                </div>
              </div>
              <h2>Indicators:</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(100px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
                  <div style={{ fontWeight: 'bold' }}>RSI</div>
                  <div>{stockData.indicators.rsi.toFixed(2)}</div>
                </div>
                <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
                  <div style={{ fontWeight: 'bold' }}>SMA 20</div>
                  <div>{stockData.indicators.sma_20.toFixed(2)}</div>
                </div>
                <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', textAlign: 'center', border: '1px solid #ddd' }}>
                  <div style={{ fontWeight: 'bold' }}>SMA 50</div>
                  <div>{stockData.indicators.sma_50.toFixed(2)}</div>
                </div>
              </div>
              {/* <p><strong>Sentiment:</strong> {stockData.sentiment}</p> */}
              <h2>Reasons:</h2>
              <ul style={{ listStyleType: 'none', padding: '0' }}>
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
      <section id="spacer">
        <p>RevUC 2026 Project</p>
      </section>
    </>
  );
}

export default App;
