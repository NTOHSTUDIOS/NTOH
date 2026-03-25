import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const partnerId = process.env.SHOPEE_PARTNER_ID?.trim() || '';
const partnerKey = process.env.SHOPEE_PARTNER_KEY?.trim() || '';
const shopId = Number(process.env.SHOPEE_SHOP_ID?.trim() || '0');
const redirectUri = 'https://ntoh-automacao.vercel.app'; // Seu callback

if (!partnerId || !partnerKey || shopId === 0) {
  console.error('❌ Vars vazias no .env');
  process.exit(1);
}

const baseUrl = 'https://partner.test-stable.shopeemobile.com'; // Sandbox Shopee BR correto
const pathAuth = '/webapi/auth';
const timestamp = Math.floor(Date.now() / 1000).toString();
const baseString = partnerId + pathAuth + timestamp + shopId + redirectUri;
const sign = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');

const authUrl = `${baseUrl}${pathAuth}?partner_id=${partnerId}&timestamp=${timestamp}&shop_id=${shopId}&redirect=${encodeURIComponent(redirectUri)}&sign=${sign}`;

console.log('🔗 LINK AUTORIZAÇÃO SANDBOX BR FRESH:');
console.log(authUrl);
console.log('\n📋 Abra navegador > autorize > copie code (?code=...) > cole linha 19 get-token.ts');