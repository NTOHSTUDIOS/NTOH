export default async function handler(req, res) {
  res.status(200).json({
    mode: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'DEVELOPMENT',
    baseUrl: process.env.SHOPEE_API_BASE_URL || 'sandbox'
  });
}