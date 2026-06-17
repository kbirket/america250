import { getSessionFromCookies } from '../../../lib/auth'
import { getTriviaForDate, getAnsweredToday, saveAnswer } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  const { questionId, answer } = req.body
  if (!questionId || !answer) return res.status(400).json({ error: 'Missing fields.' })

  const today = new Date().toLocaleDateString('en-CA')
  const questions = await getTriviaForDate(today)
  const answered = await getAnsweredToday(session.email, today)

  const q = questions.find(q => q.id === questionId)
  if (!q) return res.status(404).json({ error: 'Question not found.' })
  if (answered.includes(questionId)) return res.status(400).json({ error: 'Already answered.' })

  // Check unlock logic
  const idx = questions.indexOf(q)
  if (idx > 0 && !answered.includes(questions[idx - 1]?.id)) {
    return res.status(400).json({ error: 'Previous question not yet answered.' })
  }

const correct = answer.toUpperCase() === q.CorrectAnswer
  const isPractice = today < '2026-06-29'
  await saveAnswer(session.email, questionId, correct, today)

  return res.status(200).json({ correct, correctAnswer: q.CorrectAnswer, entryEarned: correct && !isPractice, isPractice })
}
