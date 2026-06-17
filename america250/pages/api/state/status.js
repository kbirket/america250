import { getSessionFromCookies } from '../../../lib/auth'
import base, { Tables } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  const records = await base(Tables.STATE_ANSWERS).select({
    filterByFormula: `{MemberEmail} = '${session.email}'`,
  }).firstPage()

  const answered = {}
  const correct = {}
  records.forEach(r => {
    answered[r.fields.Date] = r.fields.Answer
    correct[r.fields.Date] = r.fields.Correct
  })

  return res.status(200).json({ answered, correct })
}
