export default function Sidebar({ activeTab, setActiveTab, savedThreads, onLoadReport, apiBase, isDarkMode, setIsDarkMode }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">R</div>
        <div>
          <div className="logo-title">ResearchAgent</div>
          <div className="logo-sub">LangGraph · Multi-agent</div>
        </div>
      </div>

      <nav className="nav">
        <button
          className={`nav-btn ${activeTab === 'research' ? 'active' : ''}`}
          onClick={() => setActiveTab('research')}
        >
          <span>⚡</span> New Research
        </button>
        <button
          className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <span>🕑</span> Past Runs
        </button>
      </nav>

      <div className="theme-toggle">
        <button
          className="theme-btn"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {savedThreads.length > 0 && (
        <div className="thread-list">
          <div className="thread-list-label">Recent</div>
          {savedThreads.map(t => (
            <button key={t.id} className="thread-item" onClick={() => onLoadReport(t.id)}>
              <div className="thread-query">
                {t.query.slice(0, 38)}{t.query.length > 38 ? '…' : ''}
              </div>
              <div className="thread-ts">{t.ts}</div>
            </button>
          ))}
        </div>
      )}

      <div className="sidebar-footer">
        <a href={`${apiBase}/docs`} target="_blank" rel="noreferrer" className="api-link">
          API Docs ↗
        </a>
      </div>
    </aside>
  )
}