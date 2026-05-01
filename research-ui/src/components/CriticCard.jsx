function ScoreBar({ score }) {
  const pct = Math.round(score * 100)
  const color = score >= 0.8 ? '#4ade80' : score >= 0.6 ? '#facc15' : '#f87171'
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="score-pct" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function CriticCard({ data }) {
  return (
    <div className="critic-card">
      <div className="critic-title">
        ⚖️ Critic Evaluation · Attempt {data.retry_count}
      </div>

      <div className="scores-list">
        {data.scores?.map((s, i) => (
          <div key={i} className="score-row">
            <div className="score-q">{s.question}</div>
            <ScoreBar score={s.score} />
          </div>
        ))}
      </div>

      {data.critique && (
        <div className="critique-text">💬 {data.critique}</div>
      )}
    </div>
  )
}