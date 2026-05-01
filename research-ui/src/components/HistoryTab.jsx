import { useState } from 'react'

export default function HistoryTab({ savedThreads, onLoadReport, apiBase }) {
  const [historyInput, setHistoryInput] = useState('')
  const [historyData, setHistoryData] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadHistory = async (tid) => {
    if (!tid.trim()) return
    setLoading(true)
    setHistoryData(null)
    try {
      const resp = await fetch(`${apiBase}/history/${tid.trim()}`)
      const data = await resp.json()
      setHistoryData(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="history-tab">
      <div className="top-bar">
        <h1 className="page-title">Past Runs</h1>
        <p className="page-sub">Inspect SQLite checkpoints for any thread</p>
      </div>

      <div className="history-lookup">
        <div className="query-row">
          <input
            className="thread-input full"
            placeholder="Enter a thread ID to inspect checkpoints…"
            value={historyInput}
            onChange={e => setHistoryInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') loadHistory(historyInput) }}
          />
          <button className="run-btn" onClick={() => loadHistory(historyInput)}>
            Inspect
          </button>
        </div>
      </div>

      {savedThreads.length > 0 && (
        <div className="history-recent-label">Or click a run from this session:</div>
      )}

      {savedThreads.map(t => (
        <button key={t.id} className="history-row" onClick={() => loadHistory(t.id)}>
          <div className="history-q">{t.query}</div>
          <div className="history-meta">{t.id} · {t.ts}</div>
        </button>
      ))}

      {loading && <div className="loading-msg">Loading checkpoints…</div>}

      {historyData && (
        <div className="history-detail">
          <div className="critic-title">Thread: {historyData.thread_id}</div>
          <div className="history-subtitle">
            {historyData.total_checkpoints} checkpoints saved in SQLite
          </div>
          <div className="steps-list">
            {historyData.steps?.map((s, i) => (
              <div key={i} className="step-row">
                <span className="step-num">#{s.step}</span>
                <span className="step-node">{s.node || '—'}</span>
                <span className="step-retry">retry {s.retry_count}</span>
              </div>
            ))}
          </div>
          <button
            className="run-btn"
            style={{ marginTop: '1rem' }}
            onClick={() => onLoadReport(historyData.thread_id)}
          >
            Load Report →
          </button>
        </div>
      )}
    </div>
  )
}