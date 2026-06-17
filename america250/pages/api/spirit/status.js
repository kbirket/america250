import { getSessionFromCookies } from '../../../lib/auth'
import { getSpiritSubmission } from '../../../lib/airtable'
import { SPIRIT_WEEK } from '../../../lib/content'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  const dates = SPIRIT_WEEK.map(d => d.date)
  const results = await Promise.all(dates.map(d => getSpiritSubmission(session.email, d)))
  const submittedDates = dates.filter((d, i) => !!results[i])

  return res.status(200).json({ submittedDates })
}
