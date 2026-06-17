import { useState, useEffect } from 'react'
import { checkBingo } from '../lib/bingo'

export default function BingoTab({ member, onToast }) {
  const [squares, setSquares] = useState([])
  const [marked, setMarked] = useState([])
  const [loading, setLoading] = useState(true)
  const [wins, setWins] = useState([])
  const [blackout, setBlackout] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/bingo/board')
      .then(r => r.json())
      .then(d => {
        setSquares(d.squares || [])
        setMarked(d.marked || [12])
        const { wins, blackout } = checkBingo(d.marked || [12])
        setWins(wins)
        setBlackout(blackout)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function toggleCell(idx) {
    if (idx === 12) return // FREE space
    const newMarked = marked.includes(idx)
      ? marked.filter(i => i !== idx)
      : [...marked, idx]

    setMarked(newMarked)

    const { wins: newWins, blackout: newBlackout, hasBingo } = checkBingo(newMarked)

    const hadBingo = wins.length > 0
    const hadBlackout = blackout

    setWins(newWins)
    setBlackout(newBlackout)

    setSaving(true)
    const r = await fetch('/api/bingo/board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marked: newMarked }),
    })
    const result = await r.json()
    setSaving(false)

    if (!hadBingo && hasBingo) onToast('🎉 BINGO! +3 entries earned!')
    if (!hadBlackout && newBlackout) onToast('🌟 BLACKOUT! +10 entries earned!')
  }

  if (loading) return <div className="loading">Loading your bingo board...</div>

  const bingoCount = wins.length
  const markedCount = marked.filter(i => i !== 12).length

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="section-label" style={{ margin: 0 }}>America 250 Bingo</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {blackout && <span style={{ fontSize: 11, fontWeight: 600, color: '#dba51f' }}>🌟 BLACKOUT +10</span>}
          {!blackout && bingoCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#2d7a3a' }}>✓ BINGO! +3</span>}
          <span style={{ fontSize: 11, color: '#9a9a9a' }}>{markedCount}/24</span>
        </div>
      </div>

      <div className="bingo-grid">
        {squares.map((text, idx) => {
          const isFree = idx === 12
          const isMarked = marked.includes(idx)
          return (
            <div
              key={idx}
              className={`bingo-cell${isFree ? ' free' : isMarked ? ' marked' : ''}`}
              onClick={() => toggleCell(idx)}
              role="button"
              aria-pressed={isMarked}
              aria-label={isFree ? 'Free space' : text}
            >
              {isFree ? '★ FREE' : text}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div className="card" style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#002868' }}>{markedCount}</div>
          <div style={{ fontSize: 10, color: '#9a9a9a' }}>squares marked</div>
        </div>
        <div className="card" style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: bingoCount > 0 ? '#2d7a3a' : '#9a9a9a' }}>
            {bingoCount > 0 ? '+3' : '—'}
          </div>
          <div style={{ fontSize: 10, color: '#9a9a9a' }}>bingo entries</div>
        </div>
        <div className="card" style={{ padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: blackout ? '#dba51f' : '#9a9a9a' }}>
            {blackout ? '+10' : '—'}
          </div>
          <div style={{ fontSize: 10, color: '#9a9a9a' }}>blackout bonus</div>
        </div>
      </div>

      <div className="info-box">
        <strong>How it works:</strong> Tap squares as you complete them. Your board is unique to you — no two employees have the same layout. Complete a row, column, or diagonal for +3 entries. Fill the whole board for +10 bonus entries!
      </div>

      <p style={{ fontSize: 11, color: '#9a9a9a', textAlign: 'center', marginTop: 8 }}>
        {saving ? 'Saving...' : 'Board auto-saves as you tap'}
      </p>
    </>
  )
}
