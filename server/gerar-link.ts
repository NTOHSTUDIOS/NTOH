import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') }); // Sandbox vars

const partnerId = process.env.SHOPEE_PARTNER_ID?.trim() || '';
const partnerKeyRaw = process.env.SHOPEE_PARTNER_KEY?.trim() || '';
const baseUrl = 'https://openplatform.sandbox.test-stable.shopee.com.br'; // BR sandbox
const pathAuth = '/api/v2/shop/auth/partner/get_token'; // Correto pra token
const redirectUrl = 'https://ntoh-automacao.vercel.app/api/shopee/auth/callback';

if (!partnerId || !partnerKeyRaw) {
  console.error('❌ Vars vazias no .env');
  process.exit(1);
}

const timestamp = Math.floor(Date.now() / 1000).toString();
const body = JSON.stringify({ shop_id: process.env.SHOPEE_SHOP_ID }); // Shop sandbox

const createSignUrl = (key: string) => {
  const baseString = timestamp + partnerId + pathAuth + body;
  const sign = crypto.createHmac('sha256', key).update(baseString).digest('hex');
  const url = `${baseUrl}${pathAuth}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;
  return url;
};

console.log('🔗 LINK TOKEN SANDBOX BR (cole code novo em get-token.ts):');
console.log(createSignUrl(partnerKeyRaw)); // Chave completa

const cleanKey = partnerKeyRaw.replace(/^shpk/, '');
console.log('\n🔗 LINK com chave limpa (sem shpk):');
console.log(createSignUrl(cleanKey));
console.log('\n📋 Abra > autorize sandbox > cole code FRESH linha 19 get-token.ts');