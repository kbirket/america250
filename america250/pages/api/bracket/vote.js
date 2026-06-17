import { getSessionFromCookies } from '../../../lib/auth'
import base, { Tables } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  const { date, option } = req.body
  if (!date || !['A', 'B'].includes(option)) return res.status(400).json({ error: 'Invalid.' })

  const existing = await base(Tables.BRACKET_VOTES).select({
    filterByFormula: `AND({MemberEmail} = '${session.email}', {Date} = '${date}')`,
    maxRecords: 1,
  }).firstPage()

  if (existing[0]) return res.status(400).json({ error: 'Already voted today.' })

  await base(Tables.BRACKET_VOTES).create({ MemberEmail: session.email, Date: date, Option: option })

  const allVotes = await base(Tables.BRACKET_VOTES).select({
    filterByFormula: `{Date} = '${date}'`,
  }).firstPage()

  const results = { [date]: { A: 0, B: 0 } }
  allVotes.forEach(r => {
    results[date][r.fields.Option] = (results[date][r.fields.Option] || 0) + 1
  })

  return res.status(200).json({ success: true, results })
}
