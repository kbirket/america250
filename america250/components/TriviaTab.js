import { useState, useEffect } from 'react'
import { FUN_FACTS } from '../lib/content'

const DIFFICULTY_LABELS = { 1: 'Easy', 2: 'Medium', 3: 'Hard' }
const OPTION_KEYS = ['A', 'B', 'C', 'D']

function DifficultyPips({ level }) {
  return (
    <span className="difficulty">
      {[1, 2, 3].map(i => (
        <span key={i} className={`pip${i <= level ? ' active' : ''}`} />
      ))}
    </span>
  )
}

export default function TriviaTab({ member, onToast }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState({})
  const [submitting, setSubmitting] = useState(null)

  const today = new Date().toLocaleDateString('en-CA')
  const funFact = FUN_FACTS[today]

  useEffect(() => {
    fetch('/api/trivia/today')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleAnswer(questionId, optionKey) {
    if (selected[questionId] || submitting) return
    setSubmitting(questionId)
    setSelected(s => ({ ...s, [questionId]: { answer: optionKey, correct: null, correctAnswer: null } }))

    const r = await fetch('/api/trivia/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, answer: optionKey }),
    })
    const result = await r.json()

    setSelected(s => ({
      ...s,
      [questionId]: { answer: optionKey, correct: result.correct, correctAnswer: result.correctAnswer },
    }))
    setSubmitting(null)

  if (result.correct) {
      onToast(result.isPractice ? '✓ Correct! (Practice round — no entries yet)' : '✓ Correct! +1 prize entry earned')
    } else {
      onToast('Not quite — keep going!')
    }
    const updated = await fetch('/api/trivia/today').then(r => r.json())
    setData(updated)
  }

  if (loading) return <div className="loading">Loading today's questions...</div>

  const entries = member?.EntriesTotal || 0
 const isEventOver = new Date() > new Date('2026-07-04T00:00:00')
  const isEventPre = false
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <>
      <div className="entries-banner">
        <div>
          <div className="big-num">{entries}</div>
        </div>
        <div className="label">
          your prize entries
          <div className="sublabel">Drawing: July 6 · Mystery prize!</div>
        </div>
        <i className="ti ti-ticket" style={{ fontSize: 28, color: 'rgba(255,255,255,0.25)', marginLeft: 'auto' }} aria-hidden="true" />
      </div>

      {/* Daily fun fact */}
      {funFact && !isEventPre && !isEventOver && (
        <div style={{
          background: '#002868', borderRadius: 12, padding: '14px 16px',
          marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>🏥</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#dba51f', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              America 250 · Healthcare Edition
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
              {funFact.fact}
            </p>
          </div>
        </div>
      )}

      {isEventPre && (
        <div className="info-box">
          <i className="ti ti-calendar" style={{ verticalAlign: -2, marginRight: 4 }} aria-hidden="true" />
          Trivia kicks off Monday, June 29! Check back then.
        </div>
      )}

      {isEventOver && (
        <div className="info-box">Spirit week has wrapped up. Thanks for celebrating America 250 with us!</div>
      )}

      {!isEventPre && !isEventOver && (
        <>
          <div className="section-label">{todayLabel} · {data?.questions?.length || 0} questions</div>

          {(!data?.questions || data.questions.length === 0) && (
            <div className="card">
              <p style={{ fontSize: 14, color: '#5a5a5a', textAlign: 'center' }}>
                No questions available today. Check back tomorrow!
              </p>
            </div>
          )}

          {data?.questions?.map((q, idx) => {
            const sel = selected[q.id]
            const isAnswered = q.answered || !!sel
            const prevAnswered = idx === 0 || !!selected[data.questions[idx - 1]?.id] || data.questions[idx - 1]?.answered
            const isUnlocked = idx === 0 || prevAnswered

            return (
              <div key={q.id} className={`card${isUnlocked ? ' card-blue' : ''}`} style={{ opacity: isUnlocked ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#5a5a5a' }}>
                    Question {idx + 1} · {DIFFICULTY_LABELS[q.difficulty]}
                    <DifficultyPips level={q.difficulty} />
                  </span>
                  {isAnswered && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: (sel?.correct ?? q.answered) ? '#2d7a3a' : '#a32d2d' }}>
                      {(sel?.correct ?? q.answered) ? '✓ +1 entry' : '✗ Answered'}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: 14, color: '#222', lineHeight: 1.5, marginBottom: 12 }}>{q.question}</p>

                {!isUnlocked && (
                  <div style={{ textAlign: 'center', fontSize: 12, color: '#9a9a9a', padding: '8px 0' }}>
                    <i className="ti ti-lock" style={{ verticalAlign: -2, marginRight: 4 }} aria-hidden="true" />
                    Answer question {idx} first to unlock
                  </div>
                )}

                {isUnlocked && OPTION_KEYS.map(key => {
                  const text = q.options[key]
                  if (!text) return null
                  let btnClass = 'btn'
                  if (isAnswered) {
                    const correctKey = sel?.correctAnswer || (q.answered && q.correct)
                    if (key === correctKey) btnClass += ' correct'
                    else if (key === sel?.answer && !sel?.correct) btnClass += ' wrong'
                  }
                  return (
                    <button
                      key={key}
                      className={btnClass}
                      onClick={() => !isAnswered && isUnlocked && handleAnswer(q.id, key)}
                      disabled={isAnswered || !!submitting}
                      style={{ cursor: isAnswered ? 'default' : 'pointer' }}
                    >
                      <span style={{ fontWeight: 500, marginRight: 6 }}>{key}.</span> {text}
                    </button>
                  )
                })}
              </div>
            )
          })}

          <p style={{ fontSize: 11, color: '#9a9a9a', textAlign: 'center', marginTop: 8 }}>
            New questions every morning · +1 entry per correct answer
          </p>
        </>
      )}
    </>
  )
}
