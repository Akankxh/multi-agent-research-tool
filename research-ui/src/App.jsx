import { useState, useRef, useCallback, useEffect } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import QueryCard from './components/QueryCard'
import Pipeline from './components/Pipeline'
import CriticCard from './components/CriticCard'
import ReportCard from './components/ReportCard'
import HistoryTab from './components/HistoryTab'
import toast, { Toaster } from 'react-hot-toast'

// App.jsx
const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default function App() {
  const [query, setQuery] = useState('')
  const [threadId, setThreadId] = useState(generateUUID)  // auto-generated on mount
  const [status, setStatus] = useState('idle')
  const [nodes, setNodes] = useState([])
  const [criticData, setCriticData] = useState(null)
  const [reportTokens, setReportTokens] = useState('')
  const [savedThreads, setSavedThreads] = useState([])
  const [activeTab, setActiveTab] = useState('research')
  const [error, setError] = useState(null)
  const [isDarkMode, setIsDarkMode] = useState(true)
  const reportRef = useRef(null)

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('savedThreads')
    if (saved) {
      try {
        setSavedThreads(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse saved threads:', e)
      }
    }
    const darkMode = localStorage.getItem('isDarkMode')
    const isDark = darkMode !== null ? JSON.parse(darkMode) : true
    setIsDarkMode(isDark)
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
  }, [])

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode))
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const reset = () => {
    setNodes([])
    setCriticData(null)
    setReportTokens('')
    setStatus('idle')
    setError(null)
  }

  const runResearch = useCallback(async () => {
    if (!query.trim()) return
    reset()
    setStatus('running')

    // Add to saved threads immediately and save to localStorage
    const newThread = { id: threadId, query: query.trim(), ts: new Date().toLocaleTimeString() }
    setSavedThreads(prev => {
      const updated = [newThread, ...prev.slice(0, 9)]
      localStorage.setItem('savedThreads', JSON.stringify(updated))
      return updated
    })

    const body = JSON.stringify({
      query: query.trim(),
      thread_id: threadId,  // always use the displayed thread_id
    })

    try {
      const resp = await fetch(`${API}/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body,
      })

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullReport = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6))

          if (data.thread_id) {
            // Thread ID already added at start
          }
          if (data.node) {
            setNodes(prev => [...prev, data.node])
            if (data.node === 'critic') setCriticData(data)
          }
          if (data.token) {
            fullReport += data.token
            setReportTokens(fullReport)
            setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 0)
          }
          if (data.done) {
            setStatus('done')
            toast.success('Research completed successfully!')
            // Auto-generate fresh thread_id for the next run
            setThreadId(generateUUID())
          }
        }
      }
    } catch (e) {
      setStatus('error')
      setError(e.message || 'An error occurred during research')
      toast.error('Research failed: ' + (e.message || 'Unknown error'))
      console.error(e)
    }
  }, [query, threadId])

  const loadReport = async (tid) => {
    try {
      const resp = await fetch(`${API}/report/${tid}`)
      if (!resp.ok) throw new Error('Not found')
      const data = await resp.json()
      setReportTokens(data.report)
      setThreadId(tid)
      setStatus('done')
      setActiveTab('research')
      setCriticData(null)
      setNodes([])
      toast.success('Report loaded successfully!')
    } catch {
      toast.error('Could not load report for this thread.')
    }
  }

  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--bg2)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
          },
        }}
      />
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedThreads={savedThreads}
        onLoadReport={loadReport}
        apiBase={API}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />
      <main className="main">
        {activeTab === 'research' && (
          <>
            <div className="top-bar">
              <h1 className="page-title">Research anything.</h1>
              <p className="page-sub">Parallel agents · critic feedback loop · SQLite checkpointing · LangSmith traced</p>
            </div>

            <QueryCard
              query={query}
              setQuery={setQuery}
              threadId={threadId}
              setThreadId={setThreadId}
              status={status}
              onRun={runResearch}
            />

            {status === 'running' && nodes.length === 0 && (
              <Pipeline nodes={nodes} status={status} threadId={threadId} isLoading={true}>
                {criticData && <CriticCard data={criticData} />}
              </Pipeline>
            )}

            {status !== 'idle' && nodes.length > 0 && (
              <Pipeline nodes={nodes} status={status} threadId={threadId}>
                {criticData && <CriticCard data={criticData} />}
              </Pipeline>
            )}

            {status === 'error' && error && (
              <div className="error-card">
                <div className="error-header">
                  <span className="error-icon">⚠️</span>
                  <span className="error-title">Research Failed</span>
                </div>
                <div className="error-message">{error}</div>
                <button className="retry-btn" onClick={runResearch}>
                  🔄 Retry Research
                </button>
              </div>
            )}

            {reportTokens && (
              <ReportCard
                report={reportTokens}
                status={status}
                threadId={threadId}
                reportRef={reportRef}
              />
            )}
          </>
        )}

        {activeTab === 'history' && (
          <HistoryTab
            savedThreads={savedThreads}
            onLoadReport={loadReport}
            apiBase={API}
          />
        )}
      </main>
    </div>
  )
}