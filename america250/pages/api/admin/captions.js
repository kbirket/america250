import { getSessionFromCookies } from '../../../lib/auth'
import base, { Tables } from '../../../lib/airtable'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'info@pattersonhc.org'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const session = await getSessionFromCookies(req)
  if (!session || session.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: 'Admin access only.' })
  }

  const { date } = req.query
  const formula = date ? `{Date} = '${date}'` : 'TRUE()'

  const records = await base(Tables.CAPTION_SUBMISSIONS).select({
    filterByFormula: formula,
    sort: [{ field: 'Date', direction: 'desc' }, { field: 'SubmittedAt', direction: 'asc' }],
  }).firstPage()

  return res.status(200).json({
    captions: records.map(r => ({ id: r.id, ...r.fields }))
  })
}
