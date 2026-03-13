export default function handler(req, res) {
  res.status(200).json({ message: 'Root API Diag 200 OK', engine: 'Vercel Serverless' })
}
