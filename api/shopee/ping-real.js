export default async function handler(req, res) {
  try {
    const partnerId = process.env.SHOPEE_PARTNER_ID;
    const partnerKey = process.env.SHOPEE_PARTNER_KEY;
    const shopId = process.env.SHOPEE_SHOP_ID;
    const baseUrl = process.env.SHOPEE_API_BASE_URL;

    console.log('Env vars:', { partnerId: !!partnerId, shopId: !!shopId, baseUrl }); // Log para debug Vercel

    if (!partnerId || !partnerKey || !shopId || !baseUrl) {
      return res.status(400).json({ erro: 'Env vars ausentes', vars: { partnerId: !!partnerId, shopId: !!shopId } });
    }

    const timestamp = Date.now().toString();
    const path = '/api/v2/shop/get_shop_info';
    const baseString = `${partnerId}${path}${timestamp}`;
    const sign = require('crypto').createHmac('sha256', partnerKey).update(baseString).digest('hex');

    const url = `${baseUrl}${path}?partner_id=${partnerId}&shop_id=${shopId}&timestamp=${timestamp}&sign=${sign}`;
    console.log('Request URL:', url.substring(0, 100) + '...'); // Log parcial

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: parseInt(partnerId), shop_id: parseInt(shopId), timestamp: parseInt(timestamp), sign })
    });

    const data = await response.json();
    console.log('Shopee response status:', response.status, 'data:', data.msg || data.error_msg);

    if (response.ok) {
      res.status(200).json({ sucesso: true, data });
    } else {
      res.status(response.status).json({ erro: data.msg || data.error_msg || 'Shopee API falhou' });
    }
  } catch (error) {
    console.error('Ping-real error:', error.message);
    res.status(500).json({ erro: 'Crash interno', details: error.message });
  }
}