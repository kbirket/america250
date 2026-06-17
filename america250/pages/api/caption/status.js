import { getSessionFromCookies } from '../../../lib/auth'
import base, { Tables } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  const [myRecords, winnerRecords] = await Promise.all([
    base(Tables.CAPTION_SUBMISSIONS).select({
      filterByFormula: `{MemberEmail} = '${session.email}'`,
    }).firstPage(),
    base(Tables.CAPTION_SUBMISSIONS).select({
      filterByFormula: `{IsWinner} = TRUE()`,
    }).firstPage(),
  ])

  const submitted = {}
  myRecords.forEach(r => { submitted[r.fields.Date] = true })

  const winners = {}
  winnerRecords.forEach(r => {
    winners[r.fields.Date] = {
      caption: r.fields.Caption,
      name: r.fields.MemberName,
      email: r.fields.MemberEmail,
    }
  })

  return res.status(200).json({ submitted, winners })
}
