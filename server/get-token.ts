import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const partnerId = Number(process.env.SHOPEE_PARTNER_ID?.trim());
const partnerKey = process.env.SHOPEE_PARTNER_KEY?.trim() || '';
const shopId = Number(process.env.SHOPEE_SHOP_ID?.trim());
const baseUrl = "https://partner.test-stable.shopeemobile.com";

// ⚠️ PEGUE O CÓDIGO DA URL APÓS CLICAR NO LINK E COLE AQUI:
const code = "COLE_O_CODE_AQUI"; 

async function getAccessToken() {
  const pathApi = "/api/v2/auth/token/get";
  const timestamp = Math.floor(Date.now() / 1000);
  const baseString = `${partnerId}${pathApi}${timestamp}`;
  const sign = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');

  const url = `${baseUrl}${pathApi}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${sign}`;

  try {
    const response = await axios.post(url, {
      code: code,
      partner_id: partnerId,
      shop_id: shopId
    });
    console.log("✅ TOKEN GERADO COM SUCESSO!");
    console.log("Access Token:", response.data.access_token);
  } catch (error: any) {
    console.error("❌ Erro:");
    console.error(error.response?.data || error.message);
  }
}

getAccessToken();