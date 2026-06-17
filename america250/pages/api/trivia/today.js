import { getSessionFromCookies } from '../../../lib/auth'
import { getTriviaForDate, getAnsweredToday } from '../../../lib/airtable'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getSessionFromCookies(req)
  if (!session) return res.status(401).json({ error: 'Not authenticated.' })

  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time

  const questions = await getTriviaForDate(today)
  const answered = await getAnsweredToday(session.email, today)

  // Strip correct answers from unanswered questions
  const safe = questions.map((q, i) => {
    const isAnswered = answered.includes(q.id)
    const prevAnswered = i === 0 || answered.includes(questions[i - 1]?.id)
    return {
      id: q.id,
      question: q.Question,
      options: { A: q.OptionA, B: q.OptionB, C: q.OptionC, D: q.OptionD },
      difficulty: q.Difficulty,
      answered: isAnswered,
      unlocked: i === 0 || prevAnswered,
      correct: isAnswered ? q.CorrectAnswer : null,
    }
  })

  return res.status(200).json({ questions: safe, answeredIds: answered, date: today })
}
