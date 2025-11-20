import { useState } from 'react';
import './Stats.css';

export default function Stats() {
  const [activeChart, setActiveChart] = useState('price');
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data - replace with real contract data
  const summaryMetrics = {
    price: '0.123',
    floor: '0.115',
    premium: '6.96',
    totalBacking: '145.8',
  };

  const secondaryStats = {
    circulatingSupply: '1,268',
    holders: '89',
    largestHolder: '12.5',
    volume24h: '45.2',
    auctionsCompleted: 156,
    lotteryRoundsCompleted: 156,
  };

  const chartTabs = [
    { id: 'price', label: `Price vs $MON` },
    { id: 'floor', label: 'Floor vs Market' },
    { id: 'backing', label: 'Backing over time' },
  ];

  const timeRanges = ['24h', '7d', '30d', 'All'];

  return (
    <div className="stats-page">
      <div className="page-container">
        {/* Page Header */}
        <section className="page-header">
          <h1 className="page-title">Stats</h1>
          <p className="page-subtitle">
            Market data and metrics for MONSTR
          </p>
        </section>

        {/* Top Summary Strip */}
        <section className="summary-strip">
          <div className="metric-card">
            <div className="metric-label">MONSTR price</div>
            <div className="metric-value">
              {summaryMetrics.price} MON
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Backing per MONSTR</div>
            <div className="metric-value">
              {summaryMetrics.floor} MON
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Premium over floor</div>
            <div className="metric-value">{summaryMetrics.premium}%</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Total backing in contract</div>
            <div className="metric-value">
              {summaryMetrics.totalBacking} MON
            </div>
          </div>
        </section>

        {/* Chart Area */}
        <section className="chart-section">
          <div className="chart-header">
            <div className="chart-tabs">
              {chartTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`chart-tab ${activeChart === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveChart(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <div className="chart-placeholder">
              <svg className="chart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
              <p>Chart: {chartTabs.find(t => t.id === activeChart)?.label}</p>
              <p className="chart-note">
                Connect a charting library (e.g., recharts, chart.js) to display data
              </p>
            </div>
          </div>

          <div className="chart-controls">
            <div className="time-range-selector">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  className={`range-btn ${timeRange === range ? 'active' : ''}`}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
            <p className="data-source-note">Data from contract events and oracle</p>
          </div>
        </section>

        {/* Secondary Stats Grid */}
        <section className="secondary-stats">
          <h2 className="section-title">Additional Metrics</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">Circulating supply</div>
              <div className="stat-value">
                {secondaryStats.circulatingSupply} MONSTR
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Total holders</div>
              <div className="stat-value">{secondaryStats.holders}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Largest holder</div>
              <div className="stat-value">{secondaryStats.largestHolder}%</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">24h volume</div>
              <div className="stat-value">
                {secondaryStats.volume24h} MON
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Auctions completed</div>
              <div className="stat-value">{secondaryStats.auctionsCompleted}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Lottery rounds completed</div>
              <div className="stat-value">{secondaryStats.lotteryRoundsCompleted}</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
