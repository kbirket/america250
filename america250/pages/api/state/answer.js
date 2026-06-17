import { getSessionFromCookies } from '../../../lib/auth'
import base, { Tables } from '../../../lib/airtable'
import { addEntries } from '../../../lib/airtable'
import { STATE_QUESTIONS } from '../../../lib/content'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  const { date, answer } = req.body
  if (!date || !answer) return res.status(400).json({ error: 'Missing fields.' })

  const existing = await base(Tables.STATE_ANSWERS).select({
    filterByFormula: `AND({MemberEmail} = '${session.email}', {Date} = '${date}')`,
    maxRecords: 1,
  }).firstPage()
  if (existing[0]) return res.status(400).json({ error: 'Already answered.' })

  const question = STATE_QUESTIONS[date]
  if (!question) return res.status(404).json({ error: 'No question for this date.' })

  const isCorrect = answer === question.correct
  await base(Tables.STATE_ANSWERS).create({
    MemberEmail: session.email,
    Date: date,
    Answer: answer,
    Correct: isCorrect,
  })

  if (isCorrect) await addEntries(session.email, 1)

  return res.status(200).json({ correct: isCorrect, correctAnswer: question.correct })
}
