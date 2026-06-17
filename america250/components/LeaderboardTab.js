import { useState, useEffect } from 'react'

const LOCATION_SHORT = {
  'Patterson Health Center': 'PHC',
  'Harper Wellness Center': 'Harper',
  'Anthony Wellness Center': 'Anthony',
  'Heritage Estates': 'Heritage',
  'DME': 'DME',
  'Conway Springs': 'Conway',
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name[0].toUpperCase()
}

function getRankDisplay(rank) {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return rank
}

export default function LeaderboardTab({ email, onToast }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  // Countdown to July 6
  const drawingDate = new Date('2026-07-06T15:00:00')
  const now = new Date()
  const msLeft = drawingDate - now
  const daysLeft = Math.max(0, Math.floor(msLeft / (1000 * 60 * 60 * 24)))
  const hoursLeft = Math.max(0, Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))

  if (loading) return <div className="loading">Loading leaderboard...</div>

  const myEntry = data?.board?.find(r => r.isMe)
  const myRank = data?.myRank || '—'
  const myEntries = data?.myEntries || 0

  return (
    <>
      {/* My stats */}
      <div className="entries-banner" style={{ marginBottom: 12 }}>
        <div>
          <div className="big-num">{myEntries}</div>
        </div>
        <div className="label">
          your entries
          <div className="sublabel">You're ranked #{myRank}</div>
        </div>
        <i className="ti ti-ticket" style={{ fontSize: 28, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }} aria-hidden="true" />
      </div>

      {/* Drawing countdown */}
      <div className="card" style={{ textAlign: 'center', marginBottom: 12, background: '#fdf3d9', borderColor: '#dba51f' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#8b6800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Prize drawing
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: '#002868' }}>
          🎁 Mystery Prize
        </div>
        <div style={{ fontSize: 12, color: '#5a5a5a', marginTop: 4 }}>
          {msLeft > 0
            ? `Drawing in ${daysLeft}d ${hoursLeft}h · July 6 at 3pm`
            : 'Drawing has occurred — winner announced!'}
        </div>
      </div>

      {/* Entry breakdown tip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Trivia', value: '+1–3/day', icon: 'ti-bulb' },
          { label: 'Spirit photo', value: '+1/day', icon: 'ti-shirt' },
          { label: 'Bingo row', value: '+3 once', icon: 'ti-grid-pattern' },
          { label: 'Blackout', value: '+10 once', icon: 'ti-star' },
        ].map(item => (
          <div key={item.label} className="card" style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 16, color: '#002868' }} aria-hidden="true" />
            <div>
              <div style={{ fontSize: 11, color: '#9a9a9a' }}>{item.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#002868' }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-label">Top 10 — all locations</div>

      {(!data?.board || data.board.length === 0) && (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ fontSize: 13, color: '#5a5a5a' }}>No entries yet — be the first to participate!</p>
        </div>
      )}

      {data?.board?.map(row => (
        <div key={row.rank} className="lb-row">
          <div className="lb-rank">{getRankDisplay(row.rank)}</div>
          <div className={`lb-avatar${row.isMe ? ' you' : ''}`}>
            {getInitials(row.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div className="lb-name" style={{ fontWeight: row.isMe ? 600 : 400 }}>
              {row.name} {row.isMe && <span style={{ fontSize: 10, color: '#9a9a9a' }}>(you)</span>}
            </div>
            <div className="lb-loc">{LOCATION_SHORT[row.location] || row.location}</div>
          </div>
          <div className={`lb-entries${row.isMe ? ' you' : ''}`}>
            {row.entries}
            <span style={{ fontSize: 10, fontWeight: 400, color: '#9a9a9a', marginLeft: 3 }}>entries</span>
          </div>
        </div>
      ))}

      <p style={{ fontSize: 11, color: '#9a9a9a', textAlign: 'center', marginTop: 12 }}>
        More entries = more chances to win · Good luck! 🇺🇸
      </p>
    </>
  )
}
