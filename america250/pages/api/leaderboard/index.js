import { getSessionFromCookies } from '../../../lib/auth'
import { getLeaderboard, getMember } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  const [board, me] = await Promise.all([
    getLeaderboard(),
    getMember(session.email),
  ])

  // Mask last name to first initial for privacy, mark self
  const masked = board.map((row, i) => {
    const parts = (row.name || '').split(' ')
    const display = parts.length > 1
      ? `${parts[0]} ${parts[parts.length - 1][0]}.`
      : parts[0]
    return {
      rank: i + 1,
      name: display,
      location: row.location,
      entries: row.entries,
      isMe: row.email === session.email,
    }
  })

  const myRank = masked.findIndex(r => r.isMe) + 1
  const myEntries = me?.fields?.EntriesTotal || 0

  return res.status(200).json({ board: masked, myRank, myEntries })
}
