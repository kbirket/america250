import { useState, useEffect } from 'react'
import { BRACKET_MATCHUPS } from '../lib/content'

export default function BracketTab({ member, onToast }) {
  const [votes, setVotes] = useState({}) // date -> 'A' or 'B'
  const [results, setResults] = useState({}) // date -> { A: count, B: count }
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toLocaleDateString('en-CA')
  const matchup = BRACKET_MATCHUPS[today]

  useEffect(() => {
    fetch('/api/bracket/today')
      .then(r => r.json())
      .then(d => {
        setVotes(d.myVotes || {})
        setResults(d.results || {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleVote(option) {
    if (votes[today] || submitting) return
    setSubmitting(true)

    const r = await fetch('/api/bracket/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, option }),
    })
    const data = await r.json()
    if (r.ok) {
      setVotes(v => ({ ...v, [today]: option }))
      setResults(data.results)
      onToast('🗳️ Vote cast!')
    }
    setSubmitting(false)
  }

  const myVote = votes[today]
  const todayResults = results[today] || { A: 0, B: 0 }
  const totalVotes = (todayResults.A || 0) + (todayResults.B || 0)

  function getPct(count) {
    if (totalVotes === 0) return 0
    return Math.round((count / totalVotes) * 100)
  }

  const isEventPre = false
  const isEventOver = new Date() > new Date('2026-07-04T00:00:00')

  if (loading) return <div className="loading">Loading today's matchup...</div>

  return (
    <>
      <div className="section-label">Patriotic Bracket</div>

      {isEventPre && (
        <div className="info-box">Bracket voting kicks off Monday, June 29!</div>
      )}

      {isEventOver && (
        <div className="info-box">Spirit week has wrapped up. Thanks for voting!</div>
      )}

      {!isEventPre && !isEventOver && !matchup && (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ fontSize: 13, color: '#5a5a5a' }}>No matchup today — check back tomorrow!</p>
        </div>
      )}

      {!isEventPre && !isEventOver && matchup && (
        <>
          <div className="card card-blue" style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#002868', textAlign: 'center', marginBottom: 16, lineHeight: 1.4 }}>
              {matchup.question}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {['A', 'B'].map(opt => {
                const text = matchup[`option${opt}`]
                const emoji = matchup.emoji[opt]
                const count = todayResults[opt] || 0
                const pct = getPct(count)
                const isMyVote = myVote === opt
                const isWinning = myVote && count >= (opt === 'A' ? todayResults.B : todayResults.A)

                return (
                  <button
                    key={opt}
                    onClick={() => handleVote(opt)}
                    disabled={!!myVote || submitting}
                    style={{
                      border: `2px solid ${isMyVote ? '#002868' : '#b5d4f4'}`,
                      borderRadius: 12,
                      padding: '14px 10px',
                      background: isMyVote ? '#002868' : 'white',
                      cursor: myVote ? 'default' : 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{emoji}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isMyVote ? 'white' : '#002868', lineHeight: 1.3, marginBottom: myVote ? 8 : 0 }}>
                      {text}
                      {isMyVote && <span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Your pick ✓</span>}
                    </div>

                    {myVote && (
                      <>
                        <div style={{
                          height: 6, borderRadius: 3, background: isMyVote ? 'rgba(255,255,255,0.3)' : '#e0e0e0',
                          margin: '0 0 4px', overflow: 'hidden',
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            background: isMyVote ? 'white' : '#002868',
                            width: `${pct}%`, transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <div style={{ fontSize: 11, color: isMyVote ? 'rgba(255,255,255,0.85)' : '#5a5a5a' }}>
                          {pct}% · {count} vote{count !== 1 ? 's' : ''}
                        </div>
                      </>
                    )}
                  </button>
                )
              })}
            </div>

            {!myVote && (
              <p style={{ textAlign: 'center', fontSize: 11, color: '#5a5a5a', marginTop: 12 }}>
                Tap to cast your vote — results reveal after you pick!
              </p>
            )}

            {myVote && (
              <p style={{ textAlign: 'center', fontSize: 11, color: '#5a5a5a', marginTop: 12 }}>
                {totalVotes} total vote{totalVotes !== 1 ? 's' : ''} · Results update in real time
              </p>
            )}
          </div>

          {/* Past matchups */}
          {Object.entries(BRACKET_MATCHUPS)
            .filter(([date]) => date < today && votes[date])
            .reverse()
            .map(([date, m]) => {
              const r = results[date] || { A: 0, B: 0 }
              const total = (r.A || 0) + (r.B || 0)
              const winner = (r.A || 0) >= (r.B || 0) ? 'A' : 'B'
              return (
                <div key={date} className="card" style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: '#9a9a9a', marginBottom: 4 }}>
                    {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#002868', marginBottom: 6 }}>{m.question}</div>
                  <div style={{ fontSize: 12, color: '#5a5a5a' }}>
                    {m.emoji[winner]} <strong>{m[`option${winner}`]}</strong> won with {Math.round(((r[winner] || 0) / total) * 100)}% of the vote
                    {votes[date] === winner ? ' · You picked the winner! 🎉' : ''}
                  </div>
                </div>
              )
            })}
        </>
      )}
    </>
  )
}
