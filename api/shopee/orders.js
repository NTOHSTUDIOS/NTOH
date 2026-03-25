// api/shopee/order.js
export default async function handler(req, res) {
  try {
    const { shop_id, access_token } = req.query;
    if (!shop_id || !access_token) return res.status(400).json({ erro: 'shop_id ou access_token ausente' });

    const partnerId = process.env.SHOPEE_PARTNER_ID;
    const partnerKey = process.env.SHOPEE_PARTNER_KEY;
    const baseUrl = process.env.SHOPEE_API_BASE_URL;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const path = '/api/v2/order/get_order_list';
    const baseString = partnerId + path + timestamp;
    const crypto = await import('crypto');
    const sign = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');

    const url = `${baseUrl}${path}?partner_id=${partnerId}&shop_id=${shop_id}&timestamp=${timestamp}&sign=${sign}&access_token=${access_token}&page_size=10&page_no=1&order_status=all`;

    const response = await fetch(url);
    const data = await response.json();

    res.status(response.status).json({ sucesso: response.ok, data });
  } catch (error) {
    console.error('ORDERS ERROR:', error.message);
    res.status(500).json({ erro: 'Falha API', details: error.message });
  }
}