import { useState, useEffect } from 'react'
import { CAPTION_CONTESTS } from '../lib/content'

export default function CaptionTab({ member, email, onToast }) {
  const [submissions, setSubmissions] = useState({}) // date -> caption text
  const [submitted, setSubmitted] = useState({}) // date -> bool
  const [caption, setCaption] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [winners, setWinners] = useState({}) // date -> { caption, name }

const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' }) 
  const contest = CAPTION_CONTESTS[today]

  useEffect(() => {
    fetch('/api/caption/status')
      .then(r => r.json())
      .then(d => {
        setSubmitted(d.submitted || {})
        setWinners(d.winners || {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSubmit() {
    if (!caption.trim() || submitted[today] || submitting) return
    setSubmitting(true)

    const r = await fetch('/api/caption/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, caption: caption.trim() }),
    })
    if (r.ok) {
      setSubmitted(s => ({ ...s, [today]: true }))
      setSubmissions(s => ({ ...s, [today]: caption.trim() }))
      setCaption('')
      onToast('😂 Caption submitted!')
    }
    setSubmitting(false)
  }

  const isEventPre = false
  const isEventOver = new Date() > new Date('2026-07-04T00:00:00')

  if (loading) return <div className="loading">Loading caption contest...</div>

  return (
    <>
      <div className="section-label">Caption Contest</div>

      {isEventPre && <div className="info-box">Caption contest kicks off Monday, June 29!</div>}
      {isEventOver && <div className="info-box">Spirit week has wrapped — thanks for the laughs!</div>}

      {!isEventPre && !isEventOver && contest && (
        <div className="card card-blue" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#5a5a5a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Today's scenario
          </div>
          <div style={{
            background: '#002868', borderRadius: 10, padding: '16px',
            marginBottom: 14,
          }}>
            <p style={{ fontSize: 13, color: 'white', lineHeight: 1.6, fontStyle: 'italic' }}>
              "{contest.scenario}"
            </p>
          </div>

          {!submitted[today] ? (
            <>
              <label className="input-label">Your caption</label>
              <textarea
                className="input-field"
                style={{ minHeight: 80, resize: 'vertical' }}
                placeholder="Write something funny..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
                maxLength={280}
              />
              <div style={{ fontSize: 11, color: '#9a9a9a', textAlign: 'right', marginTop: 4, marginBottom: 10 }}>
                {caption.length}/280
              </div>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={!caption.trim() || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit caption 😂'}
              </button>
              <p style={{ fontSize: 11, color: '#9a9a9a', textAlign: 'center', marginTop: 8 }}>
                Winner chosen by admin · announced the next morning
              </p>
            </>
          ) : (
            <div className="success-box">
              <strong>Caption submitted!</strong>
              <p style={{ fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>"{submissions[today]}"</p>
              <p style={{ fontSize: 11, marginTop: 4, color: '#5a5a5a' }}>Winner announced tomorrow morning. Fingers crossed! 🤞</p>
            </div>
          )}
        </div>
      )}

      {/* Past winners */}
      {Object.entries(CAPTION_CONTESTS)
        .filter(([date]) => date < today && winners[date])
        .reverse()
        .map(([date, c]) => (
          <div key={date} className="card" style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: '#9a9a9a', marginBottom: 6 }}>
              {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · Winner
            </div>
            <div style={{ fontSize: 12, color: '#5a5a5a', fontStyle: 'italic', marginBottom: 4 }}>
              "{winners[date].caption}"
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#002868' }}>
              — {winners[date].name}
              {winners[date].email === email && ' 🏆 (You!)'}
            </div>
          </div>
        ))}

      {Object.values(winners).length === 0 && new Date() >= new Date('2026-06-29T00:00:00') && (
        <div style={{ textAlign: 'center', fontSize: 12, color: '#9a9a9a', marginTop: 12 }}>
          No winners announced yet — check back each morning!
        </div>
      )}
    </>
  )
}
