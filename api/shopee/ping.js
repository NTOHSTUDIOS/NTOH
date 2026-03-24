export default async function handler(req, res) {
  res.status(200).json({ sucesso: true, data: 'Ping live OK' });
}