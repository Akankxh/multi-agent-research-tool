import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import toast from 'react-hot-toast'

export default function ReportCard({ report, status, threadId, reportRef }) {
  // Calculate word count and read time
  const wordCount = report.split(/\s+/).filter(word => word.length > 0).length
  const readTimeMinutes = Math.ceil(wordCount / 200) // Average reading speed

  // Extract source links from References section
  const extractSourceLinks = (markdown) => {
    const referencesMatch = markdown.match(/## References\s*\n([\s\S]*?)(?=\n##|\n*$)/)
    if (!referencesMatch) return []

    const referencesText = referencesMatch[1]
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
    const links = []
    let match

    while ((match = linkRegex.exec(referencesText)) !== null) {
      links.push({
        text: match[1],
        url: match[2]
      })
    }

    return links
  }

  const sourceLinks = extractSourceLinks(report)

  // Download report as markdown file
  const downloadReport = () => {
    const blob = new Blob([report], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `research-report-${threadId.slice(0, 8)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Report downloaded successfully!')
  }

  return (
    <div className="report-card">
      <div className="report-header">
        <div className="report-title-section">
          <div className="report-title">📄 Final Report</div>
          <div className="report-stats">
            ~{wordCount.toLocaleString()} words · {readTimeMinutes} min read
          </div>
        </div>
        <div className="report-actions">
          <button
            className="download-btn"
            onClick={downloadReport}
          >
            📥 Download .md
          </button>
          <button
            className="copy-btn"
            onClick={() => {
              navigator.clipboard.writeText(report)
              toast.success('Report copied to clipboard!')
            }}
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

      {sourceLinks.length > 0 && (
        <div className="source-links">
          <div className="source-links-title">🔗 Sources</div>
          <div className="source-links-grid">
            {sourceLinks.map((link, index) => (
              <a
                key={index}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link-chip"
              >
                {link.text}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}