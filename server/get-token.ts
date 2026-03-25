import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), '..', '.env') }); // Sandbox vars

const partnerId = process.env.SHOPEE_PARTNER_ID?.trim() || '';
const partnerKey = process.env.SHOPEE_PARTNER_KEY?.trim() || '';
const shopId = Number(process.env.SHOPEE_SHOP_ID?.trim() || '0');
const baseUrl = process.env.SHOPEE_API_BASE_URL || 'partner.test-pod.shopee.com'; // Sandbox!

// Cole NOVO code test FRESH aqui
const code = '4b46656f6f524a7842474e71524e4d56';

console.log('🔍 Vars:', {
  partnerId: partnerId || '❌ VAZIO',
  partnerKey: partnerKey ? '✅ OK' : '❌ VAZIO',
  shopId: shopId || '❌ 0',
  baseUrl,
});

async function getAccessToken() {
  if (!partnerId || !partnerKey || shopId === 0) {
    console.error('❌ Vars vazias');
    return;
  }
  if (!code || code.length < 20) {
    console.error('❌ Code inválido – gere novo sandbox!');
    return;
  }

  const pathApi = '/api/v2/shop/auth/partner/get_token';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify({ code, shop_id: shopId });
  const baseString = timestamp + partnerId + pathApi + body;
  const sign = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');

  const url = `${baseUrl}${pathApi}?partner_id=${partnerId}&timestamp=${timestamp}&shop_id=${shopId}&sign=${sign}`;

  console.log('🔗 URL:', url);
  console.log('📝 Body:', body);
  console.log('🔑 Sign:', sign.substring(0, 20) + '...');

  try {
    const response = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' } });
    console.log('✅ TOKENS SANDBOX!');
    console.log('Access:', response.data.access_token);
    console.log('Refresh:', response.data.refresh_token);
    console.log('\n🔥 Cole no .env:\nVITE_SHOPEE_ACCESS_TOKEN=' + response.data.access_token + '\nVITE_SHOPEE_REFRESH_TOKEN=' + response.data.refresh_token);
  } catch (error: any) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

getAccessToken();