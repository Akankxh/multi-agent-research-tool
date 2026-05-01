import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ReportCard({ report, status, threadId, reportRef }) {
  return (
    <div className="report-card">
      <div className="report-header">
        <div className="report-title">📄 Final Report</div>
        <div className="report-actions">
          <button
            className="copy-btn"
            onClick={() => navigator.clipboard.writeText(report)}
          >
            Copy Markdown
          </button>
          {threadId && (
            <span className="thread-tag">
              🧵 {threadId.slice(0, 12)}…
            </span>
          )}
        </div>
      </div>

      <div className="report-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
        {status === 'running' && <span className="cursor-blink" />}
        <div ref={reportRef} />
      </div>
    </div>
  )
}