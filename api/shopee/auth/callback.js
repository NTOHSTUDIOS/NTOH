export default async function handler(req, res) {
  try {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const code = searchParams.get('code');
    const shop_id = searchParams.get('shop_id') || searchParams.get('main_account_id');
    
    console.log('Params:', { code, shop_id });

    if (!code || !shop_id) {
      return res.status(400).json({ erro: 'Faltam code ou shop_id no redirect' });
    }

    const partnerId = process.env.SHOPEE_PARTNER_ID;
    const partnerKey = process.env.SHOPEE_PARTNER_KEY;
    const baseUrl = process.env.SHOPEE_API_BASE_URL;

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const path = '/api/v2/shop/auth_partner';
    const baseString = partnerId + path + timestamp;
    
    const crypto = await import('crypto');
    const sign = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');

    const url = `${baseUrl}${path}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}&code=${code}&shop_id=${shop_id}`;
    
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();
    
    const token = {
      shop_id: Number(shop_id),
      access_token: data.access_token,
      refresh_token: data.refresh_token
    };
    
    console.log('Token:', token);
    
    res.status(200).send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✅ Loja ${shop_id} Conectada!</h1>
          <p>Token salvo nos logs Vercel.</p>
          <script>
            localStorage.setItem('shopee_token', ${JSON.stringify(token)});
          </script>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('CALLBACK ERROR:', error.message);
    res.status(500).send(`Erro: ${error.message}`);
  }
} 