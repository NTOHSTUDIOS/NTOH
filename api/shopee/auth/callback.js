export default async function handler(req, res) {
  try {
    const { code, shop_id } = req.query;
    
    if (!code || !shop_id) {
      return res.status(400).json({ erro: 'Code ou shop_id ausente' });
    }

    const partnerId = process.env.SHOPEE_PARTNER_ID;
    const partnerKey = process.env.SHOPEE_PARTNER_KEY;
    const baseUrl = process.env.SHOPEE_API_BASE_URL;

    const timestamp = Date.now().toString();
    const path = '/api/v2/shop/auth/partner/get_token';
    const baseString = partnerId + path + timestamp;
    const crypto = await import('crypto');
    const sign = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');

    const tokenResponse = await fetch(`${baseUrl}${path}?partner_id=${partnerId}&shop_id=${shop_id}&code=${code}&timestamp=${timestamp}&sign=${sign}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partner_id: parseInt(partnerId),
        shop_id: parseInt(shop_id),
        code,
        timestamp: parseInt(timestamp),
        sign
      })
    });

    const tokenData = await tokenResponse.json();

    // Salva token (em produção use DB/Redis)
    console.log('Token salvo:', { shop_id, access_token: tokenData.access_token });

    res.status(200).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✅ Autorização OK!</h1>
          <p>Loja: ${shop_id}</p>
          <p>Token salvo. <a href="/">Voltar ao app</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Auth callback error:', error);
    res.status(500).send(`Erro: ${error.message}`);
  }
}