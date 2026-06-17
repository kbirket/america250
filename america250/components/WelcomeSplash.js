export default function WelcomeSplash({ member, onDone }) {
  return (
    <div className="app-shell">
      <div className="app-header">
        <div style={{ color: '#dba51f', fontSize: 16, marginBottom: 4, letterSpacing: 6 }}>★ ★ ★</div>
        <h1>PHC America 250</h1>
        <div className="subtitle">Spirit Week · June 29 – July 3, 2026</div>
      </div>
      <div className="header-stars">★ ★ ★ ★ ★ ★ ★ ★</div>

      <div className="tab-content">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🇺🇸</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#002868', marginBottom: 8 }}>
            Welcome, {member?.Name?.split(' ')[0] || 'friend'}!
          </h2>
          <p style={{ fontSize: 14, color: '#5a5a5a', lineHeight: 1.6 }}>
            Here's how to earn prize entries this week. The more you do, the more chances you have to win the mystery prize — announced July 6!
          </p>
        </div>

        {[
          { icon: 'ti-bulb', color: '#e6f1fb', iconColor: '#0c447c', title: 'Daily Trivia', desc: '3 questions per day, easy to hard. +1 entry per correct answer — up to +3 per day.' },
          { icon: 'ti-podium', color: '#fcebeb', iconColor: '#a32d2d', title: 'Patriotic Bracket', desc: 'One fun matchup per day. Vote for your pick and see how your coworkers voted!' },
          { icon: 'ti-map', color: '#eaf3de', iconColor: '#3b6d11', title: 'Name That State', desc: 'Identify a U.S. state from its outline. +1 entry per correct answer.' },
          { icon: 'ti-shirt', color: '#faeeda', iconColor: '#854f0b', title: 'Spirit Week', desc: 'Submit an outfit photo each day for +1 entry. Five themes, five chances!' },
          { icon: 'ti-grid-pattern', color: '#eeedfe', iconColor: '#3c3489', title: 'Bingo', desc: 'Your unique board auto-generates. Complete a row for +3, full blackout for +10!' },
          { icon: 'ti-camera', color: '#f9e8ea', iconColor: '#B22234', title: 'Photo Contest', desc: 'Submit a patriotic photo for +1 entry. Vote for your favorites. People\'s Choice winner announced July 3!' },
          { icon: 'ti-pencil', color: '#e6f1fb', iconColor: '#0c447c', title: 'Caption Contest', desc: 'Submit the funniest caption for each day\'s scenario. Winner picked by the admin!' },
        ].map(item => (
          <div key={item.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: item.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 18, color: item.iconColor }} aria-hidden="true" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#002868', marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: '#5a5a5a', lineHeight: 1.5 }}>{item.desc}</div>
            </div>
          </div>
        ))}

        <button
          className="btn-primary"
          style={{ marginTop: 8 }}
          onClick={onDone}
        >
          Let's go! 🎉
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#9a9a9a', marginTop: 10 }}>
          Prize drawing: July 6 · Mystery prize awaits!
        </p>
      </div>
    </div>
  )
}
