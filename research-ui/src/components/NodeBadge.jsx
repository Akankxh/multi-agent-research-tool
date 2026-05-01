const LABELS = {
  planner: '🗺 Planner',
  researcher: '🔍 Researcher',
  critic: '⚖️ Critic',
  writer: '✍️ Writer',
}

export default function NodeBadge({ node }) {
  return (
    <div className={`node-badge node-${node}`}>
      <span className="node-label">{LABELS[node] || node}</span>
      <span className="node-done">done</span>
    </div>
  )
}