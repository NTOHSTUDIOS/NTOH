import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const partnerId = process.env.SHOPEE_PARTNER_ID?.trim() || '';
const partnerKeyRaw = process.env.SHOPEE_PARTNER_KEY?.trim() || '';
const baseUrl = "https://partner.test-stable.shopeemobile.com";
const pathApi = "/api/v2/shop/auth_partner";
const redirectUrl = "https://ntoh-automacao.vercel.app";

async function generateLinks() {
    // Usamos o horário do seu PC, mas arredondado
    const timestamp = Math.floor(Date.now() / 1000);
    const baseString = `${partnerId}${pathApi}${timestamp}`;

    // Função para gerar o link com uma chave específica
    const createUrl = (key: string) => {
        const sign = crypto.createHmac('sha256', key).update(baseString).digest('hex');
        const url = new URL(baseUrl + pathApi);
        url.searchParams.append("partner_id", partnerId);
        url.searchParams.append("timestamp", timestamp.toString());
        url.searchParams.append("sign", sign);
        url.searchParams.append("redirect", redirectUrl);
        return url.toString();
    };

    console.log("--- 🕵️‍♂️ TESTE DE ASSINATURA ---");
    console.log("ID:", partnerId);
    console.log("Timestamp usado:", timestamp);
    
    console.log("\n🔴 OPÇÃO A (Usando a chave EXATAMENTE como está no .env):");
    console.log(createUrl(partnerKeyRaw));

    const cleanKey = partnerKeyRaw.replace('shpk', '');
    console.log("\n🔵 OPÇÃO B (Removendo o prefixo 'shpk'):");
    console.log(createUrl(cleanKey));

    console.log("\n⚠️ DICA: Se ambos falharem, verifique se o relógio do seu Windows está 'Sincronizado' nas configurações de Data e Hora.");
}

generateLinks();