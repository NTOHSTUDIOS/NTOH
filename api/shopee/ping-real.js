export default async function handler(req, res) {
  try {
    const partnerId = process.env.SHOPEE_PARTNER_ID;
    const partnerKey = process.env.SHOPEE_PARTNER_KEY;
    const shopId = process.env.SHOPEE_SHOP_ID;
    const baseUrl = process.env.SHOPEE_API_BASE_URL;

    console.log('ENV DEBUG:', {
      hasPartnerId: !!partnerId,
      hasPartnerKey: !!partnerKey,
      hasShopId: !!shopId,
      hasBaseUrl: !!baseUrl
    });

    if (!partnerId || !partnerKey || !shopId || !baseUrl) {
      return res.status(400).json({ 
        erro: 'Faltam env vars', 
        debug: { partnerId: !!partnerId, shopId: !!shopId } 
      });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const path = '/api/v2/shop/get_shop_info';
    const baseString = partnerId + path + timestamp;
    
    const crypto = await import('crypto');
    const sign = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');

    const url = `${baseUrl}${path}?partner_id=${partnerId}&shop_id=${shopId}&timestamp=${timestamp}&sign=${sign}`;
    
    const body = {
      partner_id: parseInt(partnerId),
      shop_id: parseInt(shopId),
      timestamp: parseInt(timestamp),
      sign
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    res.status(response.status).json({ 
      sucesso: response.ok, 
      status: response.status,
      data 
    });

  } catch (error) {
    console.error('PING ERROR:', error.message);
    res.status(500).json({ erro: 'Crash', details: error.message });
  }
}