import { savePhotoSubmission, getMember, getMemberPhotoSubmission } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { submissionID } = req.body
  if (!submissionID) return res.status(400).json({ error: 'No submissionID.' })

  // Fetch full submission from JotForm API
  const jotRes = await fetch(`https://api.jotform.com/submission/${submissionID}?apiKey=${process.env.JOTFORM_API_KEY}`)
  const jotData = await jotRes.json()
  const answers = jotData?.content?.answers

  if (!answers) return res.status(400).json({ error: 'Could not fetch submission.' })

  // Extract fields — find email and file URL from answers object
  let email = ''
  let photoUrl = ''
  let category = 'Other'

  Object.values(answers).forEach(field => {
    if (field.name === 'email' || field.type === 'control_email') email = field.answer || ''
    if (field.type === 'control_fileupload') photoUrl = Array.isArray(field.answer) ? field.answer[0] : field.answer || ''
    if (field.name === 'category') category = field.answer || 'Other'
  })

  if (!email) return res.status(400).json({ error: 'No email in submission.' })

  const normalizedEmail = email.toLowerCase().trim()
  const existing = await getMemberPhotoSubmission(normalizedEmail)
  if (existing) return res.status(200).json({ success: true })

  const member = await getMember(normalizedEmail)
  if (!member) return res.status(404).json({ error: 'Member not found.' })

  await savePhotoSubmission(
    normalizedEmail,
    member.fields.Name,
    member.fields.Location,
    submissionID,
    category,
    photoUrl,
  )

  return res.status(200).json({ success: true })
}
