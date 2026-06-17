import { useState, useEffect, useRef } from 'react'
import { checkBingo } from '../lib/bingo'

function Fireworks({ active, big }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const colors = ['#B22234', '#FFFFFF', '#002868', '#dba51f', '#ff6b6b', '#4fc3f7']
    const particles = []

    function createBurst(x, y) {
      const count = big ? 80 : 50
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count
        const speed = big ? (2 + Math.random() * 6) : (1.5 + Math.random() * 4)
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: big ? (2 + Math.random() * 4) : (1.5 + Math.random() * 3),
          decay: 0.015 + Math.random() * 0.01,
          gravity: 0.08,
          trail: [],
        })
      }
    }

    // Create initial bursts
    const burstCount = big ? 6 : 3
    for (let i = 0; i < burstCount; i++) {
      setTimeout(() => {
        createBurst(
          canvas.width * (0.2 + Math.random() * 0.6),
          canvas.height * (0.1 + Math.random() * 0.4),
        )
      }, i * (big ? 300 : 400))
    }

    function animate() {
      ctx.fillStyle = 'rgba(0,0,0,0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p, idx) => {
        p.trail.push({ x: p.x, y: p.y })
        if (p.trail.length > 5) p.trail.shift()

        p.x += p.vx
        p.y += p.vy
        p.vy += p.gravity
        p.vx *= 0.98
        p.alpha -= p.decay

        // Draw trail
        p.trail.forEach((t, ti) => {
          ctx.beginPath()
          ctx.arc(t.x, t.y, p.size * 0.5, 0, Math.PI * 2)
          ctx.fillStyle = p.color.replace(')', `, ${p.alpha * (ti / p.trail.length) * 0.3})`)
            .replace('rgb', 'rgba').replace('#', 'rgba(')
          ctx.fill()
        })

        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fill()
        ctx.globalAlpha = 1
      })

      // Remove dead particles
      for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].alpha <= 0) particles.splice(i, 1)
      }

      if (particles.length > 0 || animRef.current) {
        animRef.current = requestAnimationFrame(animate)
      }
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
  }, [active, big])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}

export default function BingoTab({ member, onToast }) {
  const [squares, setSquares] = useState([])
  const [marked, setMarked] = useState([])
  const [loading, setLoading] = useState(true)
  const [wins, setWins] = useState([])
  const [blackout, setBlackout] = useState(false)
  const [saving, setSaving] = useState(false)
  const announceRef = useRef(null)

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

  function announce(msg) {
    if (announceRef.current) {
      announceRef.current.textContent = ''
      setTimeout(() => { announceRef.current.textContent = msg }, 50)
    }
  }

  async function toggleCell(idx) {
    if (idx === 12) return
    const newMarked = marked.includes(idx)
      ? marked.filter(i => i !== idx)
      : [...marked, idx]

    const wasMarked = marked.includes(idx)
    const squareText = squares[idx]
    announce(wasMarked ? `Unmarked: ${squareText}` : `Marked as completed: ${squareText}`)

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

    if (!hadBingo && hasBingo) {
      announce('Congratulations! You got BINGO! 3 prize entries have been added to your total.')
      onToast('🎉 BINGO! +3 entries earned!')
    }
    if (!hadBlackout && newBlackout) {
      announce('Amazing! You completed a full blackout! 10 bonus prize entries have been added.')
      onToast('🌟 BLACKOUT! +10 entries earned!')
    }
  }

  if (loading) return <div className="loading" role="status">Loading your bingo board...</div>

  const bingoCount = wins.length
  const markedCount = marked.filter(i => i !== 12).length

  return (
    <>
      {/* Screen reader live region for announcements */}
      <div
        ref={announceRef}
        aria-live="assertive"
        aria-atomic="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="section-label" style={{ margin: 0 }}>America 250 Bingo</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {blackout && <span style={{ fontSize: 11, fontWeight: 600, color: '#dba51f' }} aria-label="Blackout achieved, plus 10 entries">🌟 BLACKOUT +10</span>}
          {!blackout && bingoCount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: '#2d7a3a' }} aria-label="Bingo achieved, plus 3 entries">✓ BINGO! +3</span>}
          <span style={{ fontSize: 11, color: '#9a9a9a' }} aria-label={`${markedCount} of 24 squares marked`}>{markedCount}/24</span>
        </div>
      </div>

      <div
        className="bingo-grid"
        role="group"
        aria-label="Bingo board — 5 by 5 grid. Use Tab to move between squares and Enter or Space to mark them."
      >
        {squares.map((text, idx) => {
          const isFree = idx === 12
          const isMarked = marked.includes(idx)
          const row = Math.floor(idx / 5) + 1
          const col = (idx % 5) + 1
          return (
            <div
              key={idx}
              className={`bingo-cell${isFree ? ' free' : isMarked ? ' marked' : ''}`}
              onClick={() => toggleCell(idx)}
              role="checkbox"
              aria-checked={isMarked}
              aria-label={
                isFree
                  ? 'Free space, center square, automatically marked'
                  : `Row ${row}, column ${col}: ${text}. ${isMarked ? 'Marked as completed.' : 'Not yet completed.'}`
              }
              tabIndex={isFree ? -1 : 0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleCell(idx)
                }
                // Arrow key navigation
                if (e.key === 'ArrowRight' && idx % 5 < 4) document.querySelectorAll('.bingo-cell')[idx + 1]?.focus()
                if (e.key === 'ArrowLeft' && idx % 5 > 0) document.querySelectorAll('.bingo-cell')[idx - 1]?.focus()
                if (e.key === 'ArrowDown' && idx < 20) document.querySelectorAll('.bingo-cell')[idx + 5]?.focus()
                if (e.key === 'ArrowUp' && idx >= 5) document.querySelectorAll('.bingo-cell')[idx - 5]?.focus()
              }}
            >
              {isFree ? '★ FREE' : text}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }} role="status" aria-label={`You have marked ${markedCount} of 24 squares. ${bingoCount > 0 ? 'You have bingo and earned 3 entries.' : ''} ${blackout ? 'You have a blackout and earned 10 bonus entries.' : ''}`}>
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

      <div className="info-box" role="note">
        <strong>How it works:</strong> Tap squares as you complete them. Your board is unique to you — no two employees have the same layout. Complete a row, column, or diagonal for +3 entries. Fill the whole board for +10 bonus entries! Use Tab to move between squares, and Enter or Space to mark them.
      </div>

      <p style={{ fontSize: 11, color: '#9a9a9a', textAlign: 'center', marginTop: 8 }} aria-live="polite">
        {saving ? 'Saving...' : 'Board auto-saves as you tap'}
      </p>
    </>
  )
}
