import { getSessionFromCookies } from '../../../lib/auth'
import base, { Tables } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  const allVotes = await base(Tables.BRACKET_VOTES).select().firstPage()
  
  const myVotes = {}
  const results = {}

  allVotes.forEach(r => {
    const { MemberEmail, Date: date, Option } = r.fields
    if (!results[date]) results[date] = { A: 0, B: 0 }
    results[date][Option] = (results[date][Option] || 0) + 1
    if (MemberEmail === session.email) myVotes[date] = Option
  })

  return res.status(200).json({ myVotes, results })
}
