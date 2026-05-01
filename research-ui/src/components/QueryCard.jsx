import { useState } from 'react'
import toast from 'react-hot-toast'

const EXAMPLE_QUERIES = [
  'Impact of LLMs on software engineering jobs in 2025',
  'How is agentic AI different from traditional AI and what are real-world use cases',
  'Best vector databases in 2025 for RAG applications',
  'How does the EU AI Act affect companies building LLM products',
]

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default function QueryCard({ query, setQuery, threadId, setThreadId, status, onRun }) {

  const copyThreadId = () => {
    navigator.clipboard.writeText(threadId)
    toast.success('Thread ID copied to clipboard!')
  }

  const refreshThreadId = () => {
    setThreadId(generateUUID())
  }

  return (
    <div className="query-card">
      <textarea
        className="query-input"
        placeholder="Ask a deep research question…  (Ctrl+Enter to run)"
        value={query}
        onChange={e => setQuery(e.target.value)}
        rows={3}
        onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onRun() }}
      />

      {/* Thread ID row */}
      <div className="thread-id-row">
        <div className="thread-id-label">Thread ID</div>
        <div className="thread-id-box">
          <span className="thread-id-value">{threadId}</span>
          <div className="thread-id-actions">
            <button className="icon-btn" title="Copy thread ID" onClick={copyThreadId}>
              ⎘
            </button>
            <button
              className="icon-btn"
              title="Generate new thread ID"
              onClick={refreshThreadId}
              disabled={status === 'running'}
            >
              ↺
            </button>
          </div>
        </div>
        <div className="thread-id-hint">Save this ID to retrieve your report later</div>
      </div>

      <div className="query-row">
        <button
          className={`run-btn ${status === 'running' ? 'running' : ''}`}
          onClick={onRun}
          disabled={status === 'running' || !query.trim()}
        >
          {status === 'running'
            ? <><span className="spinner" /> Running…</>
            : '⚡ Run Research'}
        </button>
      </div>

      {!query && (
        <div className="examples">
          <div className="examples-label">Try an example</div>
          <div className="examples-list">
            {EXAMPLE_QUERIES.map(q => (
              <button key={q} className="example-pill" onClick={() => setQuery(q)}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}