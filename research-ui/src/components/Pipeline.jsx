import NodeBadge from './NodeBadge'

const STEPS = ['planner', 'researcher', 'critic', 'writer']

export default function Pipeline({ nodes, status, threadId, children, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="pipeline loading">
        <div className="pipeline-header">
          <div className="pipeline-title skeleton"></div>
          <div className="thread-tag skeleton"></div>
        </div>

        <div className="pipeline-track">
          {STEPS.map((n, i) => (
            <div key={n} className="pipeline-step skeleton">
              <div className="pipeline-dot skeleton"></div>
              <div className="pipeline-name skeleton"></div>
            </div>
          ))}
        </div>

        <div className="node-badges">
          <div className="node-badge skeleton"></div>
          <div className="node-badge skeleton"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="pipeline">
      <div className="pipeline-header">
        <div className="pipeline-title">Agent Pipeline</div>
        {threadId && (
          <span className="thread-tag">🧵 {threadId.slice(0, 12)}…</span>
        )}
      </div>

      <div className="pipeline-track">
        {STEPS.map(n => {
          const done = nodes.includes(n)
          return (
            <div key={n} className={`pipeline-step ${done ? 'done' : ''}`}>
              <div className="pipeline-dot" />
              <div className="pipeline-name">{n}</div>
            </div>
          )
        })}
      </div>

      <div className="node-badges">
        {nodes.map((n, i) => <NodeBadge key={i} node={n} />)}
      </div>

      {children}
    </div>
  )
}