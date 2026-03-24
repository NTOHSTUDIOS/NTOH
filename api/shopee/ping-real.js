const crypto = require('crypto');

export default async function handler(req, res) {
  const partnerId = process.env.SHOPEE_PARTNER_ID;
  const partnerKey = process.env.SHOPEE_PARTNER_KEY;
  const shopId = process.env.SHOPEE_SHOP_ID;
  const baseUrl = process.env.SHOPEE_API_BASE_URL;

  if (!partnerId || !partnerKey || !shopId) {
    return res.status(400).json({ erro: 'Chaves env ausentes' });
  }

  const timestamp = Date.now().toString();
  const path = '/api/v2/shop/get_shop_info';
  const baseString = partnerId + path + timestamp;
  const sign = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');

  try {
    const response = await fetch(`${baseUrl}${path}?partner_id=${partnerId}&shop_id=${shopId}&timestamp=${timestamp}&sign=${sign}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: parseInt(partnerId), shop_id: parseInt(shopId), timestamp: parseInt(timestamp), sign })
    });

    const data = await response.json();
    res.status(200).json({ sucesso: true, data });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
}