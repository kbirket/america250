import { getSpiritSubmission, saveSpiritSubmission } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { submissionID } = req.body
  if (!submissionID) return res.status(400).json({ error: 'No submissionID.' })

  // Fetch full submission from JotForm API
  const jotRes = await fetch(`https://api.jotform.com/submission/${submissionID}?apiKey=${process.env.JOTFORM_API_KEY}`)
  const jotData = await jotRes.json()
  const answers = jotData?.content?.answers

  if (!answers) return res.status(400).json({ error: 'Could not fetch submission.' })

  let email = ''
  let date = ''

  Object.values(answers).forEach(field => {
    if (field.name === 'email' || field.type === 'control_email') email = field.answer || ''
    if (field.name === 'date' || field.type === 'control_datetime') date = field.answer || ''
  })

  if (!email || !date) return res.status(400).json({ error: 'Missing email or date.' })

  const normalizedEmail = email.toLowerCase().trim()
  const existing = await getSpiritSubmission(normalizedEmail, date)
  if (existing) return res.status(200).json({ success: true })

  await saveSpiritSubmission(normalizedEmail, date, submissionID)
  return res.status(200).json({ success: true })
}
