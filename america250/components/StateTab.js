import { useState, useEffect } from 'react'
import { STATE_QUESTIONS } from '../lib/content'

export default function StateTab({ member, onToast }) {
  const [answered, setAnswered] = useState({}) // date -> selected answer
  const [correct, setCorrect] = useState({}) // date -> boolean
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toLocaleDateString('en-CA')
  const question = STATE_QUESTIONS[today]

  useEffect(() => {
    fetch('/api/state/status')
      .then(r => r.json())
      .then(d => {
        setAnswered(d.answered || {})
        setCorrect(d.correct || {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleAnswer(option) {
    if (answered[today] || submitting || !question) return
    setSubmitting(true)

    const r = await fetch('/api/state/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: today, answer: option }),
    })
    const data = await r.json()
    setAnswered(a => ({ ...a, [today]: option }))
    setCorrect(c => ({ ...c, [today]: data.correct }))
    setSubmitting(false)

    if (data.correct) {
      onToast('✓ Correct! +1 prize entry earned')
    } else {
      onToast(`Not quite — it was ${question.correct}!`)
    }
  }

const isEventPre = false  
  const isEventOver = new Date() > new Date('2026-07-04T00:00:00')

  if (loading) return <div className="loading">Loading today's state...</div>

  const myAnswer = answered[today]
  const isCorrect = correct[today]

  return (
    <>
      <div className="section-label">Name That State!</div>

      {isEventPre && <div className="info-box">State quiz kicks off Monday, June 29!</div>}
      {isEventOver && <div className="info-box">Spirit week has wrapped — thanks for playing!</div>}

      {!isEventPre && !isEventOver && !question && (
        <div className="card" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ fontSize: 13, color: '#5a5a5a' }}>No state quiz today — check back tomorrow!</p>
        </div>
      )}

      {!isEventPre && !isEventOver && question && (
        <>
          <div className="card card-blue" style={{ marginBottom: 12 }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#5a5a5a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Which state is this?
              </div>

              {/* State silhouette using text-based hint with map emoji */}
              <div style={{
                background: '#002868', borderRadius: 12, padding: '24px 16px',
                margin: '0 auto 12px', maxWidth: 280,
              }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Hint</div>
                <p style={{ fontSize: 13, color: 'white', lineHeight: 1.5, fontStyle: 'italic' }}>
                  "{question.hint}"
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {question.options.map(opt => {
                let btnStyle = {
                  border: '1.5px solid #b5d4f4',
                  borderRadius: 10,
                  padding: '12px 8px',
                  background: 'white',
                  cursor: myAnswer ? 'default' : 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#002868',
                  transition: 'all 0.15s',
                }
                if (myAnswer) {
                  if (opt === question.correct) {
                    btnStyle = { ...btnStyle, background: '#eaf3de', borderColor: '#97c459', color: '#2d7a3a' }
                  } else if (opt === myAnswer && !isCorrect) {
                    btnStyle = { ...btnStyle, background: '#fcebeb', borderColor: '#f09595', color: '#a32d2d' }
                  }
                }
                return (
                  <button key={opt} style={btnStyle} onClick={() => handleAnswer(opt)} disabled={!!myAnswer || submitting}>
                    {opt === question.correct && myAnswer ? '✓ ' : opt === myAnswer && !isCorrect ? '✗ ' : ''}{opt}
                  </button>
                )
              })}
            </div>

            {myAnswer && (
              <div className={isCorrect ? 'success-box' : 'error-box'} style={{ marginTop: 12 }}>
                <strong>{isCorrect ? '🎉 Correct! +1 entry earned!' : `Not quite! The answer was ${question.correct}.`}</strong>
                <p style={{ marginTop: 4, fontSize: 12, lineHeight: 1.4 }}>
                  {question.funFact}
                </p>
              </div>
            )}

            {!myAnswer && (
              <p style={{ textAlign: 'center', fontSize: 11, color: '#5a5a5a', marginTop: 12 }}>
                +1 prize entry for a correct answer
              </p>
            )}
          </div>

          {/* Past questions */}
          {Object.entries(STATE_QUESTIONS)
            .filter(([date]) => date < today && answered[date])
            .reverse()
            .map(([date, q]) => (
              <div key={date} className="card" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: correct[date] ? '#eaf3de' : '#fcebeb',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14,
                }}>
                  {correct[date] ? '✓' : '✗'}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#9a9a9a' }}>
                    {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#002868' }}>{q.state}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 12, color: correct[date] ? '#2d7a3a' : '#a32d2d', fontWeight: 600 }}>
                  {correct[date] ? '+1 entry' : 'Missed'}
                </div>
              </div>
            ))}
        </>
      )}
    </>
  )
}
