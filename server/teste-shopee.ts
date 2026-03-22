import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const partnerId = Number(process.env.SHOPEE_PARTNER_ID);
const partnerKey = process.env.SHOPEE_PARTNER_KEY || '';
const redirectUrl = "https://ntoh-automacao.vercel.app/"; // Sua URL cadastrada
const baseUrl = "https://partner.test-stable.shopeemobile.com"; // Sandbox

function generateAuthLink() {
  const pathApi = "/api/v2/shop/auth_partner";
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Cálculo da assinatura para autorização
  const baseString = `${partnerId}${pathApi}${timestamp}`;
  const sign = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');

  const authUrl = `${baseUrl}${pathApi}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}&redirect=${redirectUrl}`;
  
  console.log("🔗 CLIQUE NO LINK ABAIXO PARA AUTORIZAR SUA LOJA:");
  console.log("--------------------------------------------------");
  console.log(authUrl);
  console.log("--------------------------------------------------");
}

generateAuthLink();