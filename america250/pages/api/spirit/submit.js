import { getSessionFromCookies } from '../../../lib/auth'
import { getSpiritSubmission, saveSpiritSubmission } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  const { date, jotformId } = req.body
  if (!date) return res.status(400).json({ error: 'Date required.' })

  const existing = await getSpiritSubmission(session.email, date)
  if (existing) return res.status(400).json({ error: 'Already submitted for this day.' })

  await saveSpiritSubmission(session.email, date, jotformId || '')
  return res.status(200).json({ success: true })
}
