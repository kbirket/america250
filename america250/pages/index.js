import { useState, useEffect } from 'react'
import Head from 'next/head'
import TriviaTab from '../components/TriviaTab'
import SpiritTab from '../components/SpiritTab'
import BingoTab from '../components/BingoTab'
import PhotoTab from '../components/PhotoTab'
import LeaderboardTab from '../components/LeaderboardTab'
import LoginScreen from '../components/LoginScreen'
import ProfileSetup from '../components/ProfileSetup'

const TABS = [
  { id: 'trivia', label: 'Trivia', icon: 'ti-bulb' },
  { id: 'spirit', label: 'Spirit', icon: 'ti-shirt' },
  { id: 'bingo', label: 'Bingo', icon: 'ti-grid-pattern' },
  { id: 'photos', label: 'Photos', icon: 'ti-camera' },
  { id: 'prizes', label: 'Prizes', icon: 'ti-trophy' },
]

export default function Home() {
  const [authState, setAuthState] = useState('loading') // loading | unauthenticated | new-user | authenticated
  const [activeTab, setActiveTab] = useState('trivia')
  const [member, setMember] = useState(null)
  const [email, setEmail] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.authenticated) {
          setAuthState('unauthenticated')
        } else if (data.isNewUser) {
          setEmail(data.email)
          setAuthState('new-user')
        } else {
          setMember(data.member)
          setEmail(data.email)
          setAuthState('authenticated')
        }
      })
      .catch(() => setAuthState('unauthenticated'))
  }, [])

  function showToast(msg) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  function handleLoginSuccess(data) {
    setEmail(data.email)
    if (data.isNewUser) {
      setAuthState('new-user')
    } else {
      setMember(data.member)
      setAuthState('authenticated')
    }
  }

  function handleProfileCreated(memberData) {
    setMember(memberData)
    setAuthState('authenticated')
  }

  function handleSignOut() {
    fetch('/api/auth/signout', { method: 'POST' }).then(() => {
      setAuthState('unauthenticated')
      setMember(null)
      setEmail(null)
    })
  }

  if (authState === 'loading') {
    return (
      <div className="app-shell">
        <div className="app-header">
          <div style={{ color: '#dba51f', fontSize: 16, marginBottom: 4, letterSpacing: 6 }}>★ ★ ★</div>
          <h1>PHC America 250</h1>
        </div>
        <div className="loading">Loading...</div>
      </div>
    )
  }

  if (authState === 'unauthenticated') {
    return <LoginScreen onSuccess={handleLoginSuccess} />
  }

  if (authState === 'new-user') {
    return <ProfileSetup email={email} onComplete={handleProfileCreated} />
  }

  const isAdmin = email === 'info@pattersonhc.org'

  return (
    <>
      <Head><title>PHC America 250</title></Head>
      <div className="app-shell">
        <div className="app-header">
          <div style={{ color: '#dba51f', fontSize: 14, marginBottom: 4, letterSpacing: 6 }}>★ ★ ★</div>
          <h1>PHC America 250</h1>
          <div className="subtitle">Spirit Week · June 29 – July 3</div>
        </div>
        <div className="header-stars">★ ★ ★ ★ ★ ★ ★ ★</div>

        <div className="tab-bar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`ti ${tab.icon}`} aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'trivia' && <TriviaTab member={member} onToast={showToast} />}
          {activeTab === 'spirit' && <SpiritTab member={member} onToast={showToast} />}
          {activeTab === 'bingo' && <BingoTab member={member} onToast={showToast} />}
          {activeTab === 'photos' && <PhotoTab member={member} email={email} onToast={showToast} />}
          {activeTab === 'prizes' && <LeaderboardTab email={email} onToast={showToast} />}
        </div>

        {isAdmin && (
          <div style={{ padding: '8px 16px 16px', borderTop: '1px solid #e0e0e0' }}>
            <a href="/admin" style={{ fontSize: 12, color: '#9a9a9a', display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="ti ti-settings" style={{ fontSize: 14 }} aria-hidden="true" />
              Admin panel
            </a>
          </div>
        )}

        <div style={{ padding: '8px 16px 12px', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#9a9a9a' }}>
            {member?.Name} · {member?.Location}
          </span>
          <button
            onClick={handleSignOut}
            style={{ fontSize: 11, color: '#9a9a9a', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>

        {toastMsg && (
          <div style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: '#002868', color: 'white', padding: '10px 20px',
            borderRadius: 20, fontSize: 13, fontWeight: 500, zIndex: 999,
            whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          }}>
            {toastMsg}
          </div>
        )}
      </div>
    </>
  )
}
