import Airtable from 'airtable'

const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(process.env.AIRTABLE_BASE_ID)

export const Tables = {
  MEMBERS: 'Members',
  OTP_CODES: 'OTPCodes',
  TRIVIA_QUESTIONS: 'TriviaQuestions',
  TRIVIA_ANSWERS: 'TriviaAnswers',
  BINGO_BOARDS: 'BingoBoards',
  BINGO_COMPLETIONS: 'BingoCompletions',
  SPIRIT_SUBMISSIONS: 'SpiritSubmissions',
  PHOTO_SUBMISSIONS: 'PhotoSubmissions',
  PHOTO_VOTES: 'PhotoVotes',
  BRACKET_VOTES: 'BracketVotes',
  STATE_ANSWERS: 'StateAnswers',
  CAPTION_SUBMISSIONS: 'CaptionSubmissions',
}

export default base

// --- Members ---
export async function getMember(email) {
  const records = await base(Tables.MEMBERS).select({
    filterByFormula: `{Email} = '${email}'`,
    maxRecords: 1,
  }).firstPage()
  return records[0] || null
}

export async function createMember({ email, name, location, department }) {
  const record = await base(Tables.MEMBERS).create({
    Email: email,
    Name: name,
    Location: location,
    Department: department,
    Verified: true,
    EntriesTotal: 0,
    CreatedAt: new Date().toISOString(),
  })
  return record
}

export async function addEntries(email, count) {
  const member = await getMember(email)
  if (!member) return null
  const current = member.fields.EntriesTotal || 0
  await base(Tables.MEMBERS).update(member.id, { EntriesTotal: current + count })
}

// --- OTP ---
export async function saveOTP(email, code) {
  // Delete old codes for this email first
  const old = await base(Tables.OTP_CODES).select({
    filterByFormula: `{Email} = '${email}'`,
  }).firstPage()
  for (const r of old) await base(Tables.OTP_CODES).destroy(r.id)

  const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  await base(Tables.OTP_CODES).create({ Email: email, Code: code, ExpiresAt: expires, Used: false })
}

export async function verifyOTP(email, code) {
  const records = await base(Tables.OTP_CODES).select({
    filterByFormula: `AND({Email} = '${email}', {Code} = '${code}', {Used} = FALSE())`,
    maxRecords: 1,
  }).firstPage()
  if (!records[0]) return false
  const expires = new Date(records[0].fields.ExpiresAt)
  if (expires < new Date()) return false
  await base(Tables.OTP_CODES).update(records[0].id, { Used: true })
  return true
}

// --- Trivia ---
export async function getTriviaForDate(dateStr) {
  const records = await base(Tables.TRIVIA_QUESTIONS).select({
    filterByFormula: `{Date} = '${dateStr}'`,
    sort: [{ field: 'Difficulty', direction: 'asc' }],
  }).firstPage()
  return records.map(r => ({ id: r.id, ...r.fields }))
}

export async function getAnsweredToday(email, dateStr) {
  const records = await base(Tables.TRIVIA_ANSWERS).select({
    filterByFormula: `AND({MemberEmail} = '${email}', {Date} = '${dateStr}')`,
  }).firstPage()
  return records.map(r => r.fields.QuestionID)
}

export async function saveAnswer(email, questionId, correct, dateStr) {
  await base(Tables.TRIVIA_ANSWERS).create({
    MemberEmail: email,
    QuestionID: questionId,
    Correct: correct,
    Date: dateStr,
  })
  if (correct) await addEntries(email, 1)
}

// --- Bingo ---
export async function getBingoBoard(email) {
  const records = await base(Tables.BINGO_BOARDS).select({
    filterByFormula: `{MemberEmail} = '${email}'`,
    maxRecords: 1,
  }).firstPage()
  return records[0] || null
}

export async function saveBingoBoard(email, squares, marked = []) {
  await base(Tables.BINGO_BOARDS).create({
    MemberEmail: email,
    Squares: JSON.stringify(squares),
    Marked: JSON.stringify(marked),
  })
}

export async function updateBingoMarked(email, marked) {
  const board = await getBingoBoard(email)
  if (!board) return
  await base(Tables.BINGO_BOARDS).update(board.id, { Marked: JSON.stringify(marked) })
}

export async function saveBingoCompletion(email, type, entries) {
  const existing = await base(Tables.BINGO_COMPLETIONS).select({
    filterByFormula: `AND({MemberEmail} = '${email}', {Type} = '${type}')`,
    maxRecords: 1,
  }).firstPage()
  if (existing[0]) return // already awarded
  await base(Tables.BINGO_COMPLETIONS).create({
    MemberEmail: email,
    Type: type,
    AwardedEntries: entries,
    AwardedAt: new Date().toISOString(),
  })
  await addEntries(email, entries)
}

// --- Spirit ---
export async function getSpiritSubmission(email, dateStr) {
  const records = await base(Tables.SPIRIT_SUBMISSIONS).select({
    filterByFormula: `AND({MemberEmail} = '${email}', {Date} = '${dateStr}')`,
    maxRecords: 1,
  }).firstPage()
  return records[0] || null
}

export async function saveSpiritSubmission(email, dateStr, jotformId) {
  await base(Tables.SPIRIT_SUBMISSIONS).create({
    MemberEmail: email,
    Date: dateStr,
    JotFormSubmissionID: jotformId,
    SubmittedAt: new Date().toISOString(),
  })
  await addEntries(email, 1)
}

// --- Photos ---
export async function getApprovedPhotos() {
  const records = await base(Tables.PHOTO_SUBMISSIONS).select({
    filterByFormula: `{Status} = 'approved'`,
    sort: [{ field: 'SubmittedAt', direction: 'desc' }],
  }).firstPage()
  return records.map(r => ({ id: r.id, ...r.fields }))
}

export async function getPendingPhotos() {
  const records = await base(Tables.PHOTO_SUBMISSIONS).select({
    filterByFormula: `{Status} = 'pending'`,
    sort: [{ field: 'SubmittedAt', direction: 'asc' }],
  }).firstPage()
  return records.map(r => ({ id: r.id, ...r.fields }))
}

export async function updatePhotoStatus(photoId, status) {
  await base(Tables.PHOTO_SUBMISSIONS).update(photoId, { Status: status })
}

export async function getMemberPhotoSubmission(email) {
  const records = await base(Tables.PHOTO_SUBMISSIONS).select({
    filterByFormula: `{MemberEmail} = '${email}'`,
    maxRecords: 1,
  }).firstPage()
  return records[0] || null
}

export async function savePhotoSubmission(email, name, location, jotformId, category, photoUrl) {
  await base(Tables.PHOTO_SUBMISSIONS).create({
    MemberEmail: email,
    MemberName: name,
    Location: location,
    JotFormSubmissionID: jotformId,
    Category: category,
    PhotoURL: photoUrl,
    Status: 'pending',
    Votes: 0,
    SubmittedAt: new Date().toISOString(),
  })
  await addEntries(email, 1)
}

// --- Votes ---
export async function getMemberVotes(email) {
  const records = await base(Tables.PHOTO_VOTES).select({
    filterByFormula: `{MemberEmail} = '${email}'`,
  }).firstPage()
  return records.map(r => r.fields.PhotoID)
}

export async function saveVote(email, photoId) {
  const existing = await base(Tables.PHOTO_VOTES).select({
    filterByFormula: `AND({MemberEmail} = '${email}', {PhotoID} = '${photoId}')`,
    maxRecords: 1,
  }).firstPage()
  if (existing[0]) return { error: 'Already voted for this photo' }

  const votes = await getMemberVotes(email)
  if (votes.length >= 3) return { error: 'You have used all 3 votes' }

  await base(Tables.PHOTO_VOTES).create({ MemberEmail: email, PhotoID: photoId })

  // Increment vote count on photo
  const photo = await base(Tables.PHOTO_SUBMISSIONS).find(photoId)
  const current = photo.fields.Votes || 0
  await base(Tables.PHOTO_SUBMISSIONS).update(photoId, { Votes: current + 1 })

  return { success: true }
}

// --- Leaderboard ---
export async function getLeaderboard() {
  const records = await base(Tables.MEMBERS).select({
    sort: [{ field: 'EntriesTotal', direction: 'desc' }],
    maxRecords: 20,
  }).firstPage()
  return records.map(r => ({
    name: r.fields.Name,
    location: r.fields.Location,
    entries: r.fields.EntriesTotal || 0,
    email: r.fields.Email,
  }))
}
