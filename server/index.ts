import express from "express";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

function createShopeeSign(baseString: string, partnerKey: string) {
  return crypto.createHmac("sha256", partnerKey).update(baseString).digest("hex");
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.send("Servidor Shopee rodando.");
  });

  app.get("/api/shopee/token", async (req, res) => {
    try {
      const code = String(req.query.code || "").trim();
      const shopId = Number(req.query.shop_id || 0);

      const partnerId = Number(String(process.env.SHOPEE_PARTNER_ID || "").trim());
      const partnerKey = String(process.env.SHOPEE_PARTNER_KEY || "").trim();
      const baseUrl = String(process.env.SHOPEE_API_BASE_URL || "").trim();

      if (!code || !shopId || !partnerId || !partnerKey || !baseUrl) {
        return res.status(400).json({
          sucesso: false,
          error: "Verifique code, shop_id e variáveis do .env",
        });
      }

      const pathApi = "/api/v2/auth/token/get";
      const timestamp = Math.floor(Date.now() / 1000);
      const baseString = `${partnerId}${pathApi}${timestamp}`;
      const sign = createShopeeSign(baseString, partnerKey);

      const url = new URL(`${baseUrl}${pathApi}`);
      url.searchParams.set("partner_id", String(partnerId));
      url.searchParams.set("timestamp", String(timestamp));
      url.searchParams.set("sign", sign);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          shop_id: shopId,
          partner_id: partnerId,
        }),
      });

      const data = await response.json();

      return res.status(response.status).json({
        sucesso: !!data.access_token,
        data,
        debug: {
          requestUrl: url.toString(),
          baseString,
          sign,
        },
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        error: "Erro interno",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/shopee/ping", async (_req, res) => {
    try {
      const partnerId = Number(String(process.env.SHOPEE_PARTNER_ID || "").trim());
      const partnerKey = String(process.env.SHOPEE_PARTNER_KEY || "").trim();
      const shopId = Number(String(process.env.SHOPEE_SHOP_ID || "").trim());
      const accessToken = String(process.env.SHOPEE_ACCESS_TOKEN || "").trim();
      const baseUrl = String(process.env.SHOPEE_API_BASE_URL || "").trim();

      if (!partnerId || !partnerKey || !shopId || !accessToken || !baseUrl) {
        return res.status(400).json({
          sucesso: false,
          error: "Verifique SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY, SHOPEE_SHOP_ID, SHOPEE_ACCESS_TOKEN e SHOPEE_API_BASE_URL no .env",
        });
      }

      const pathApi = "/api/v2/shop/get_shop_info";
      const timestamp = Math.floor(Date.now() / 1000);
      const baseString = `${partnerId}${pathApi}${timestamp}${accessToken}${shopId}`;
      const sign = createShopeeSign(baseString, partnerKey);

      const url = new URL(`${baseUrl}${pathApi}`);
      url.searchParams.set("partner_id", String(partnerId));
      url.searchParams.set("timestamp", String(timestamp));
      url.searchParams.set("access_token", accessToken);
      url.searchParams.set("shop_id", String(shopId));
      url.searchParams.set("sign", sign);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      return res.status(response.status).json({
        sucesso: response.ok,
        data,
        debug: {
          requestUrl: url.toString(),
          baseString,
          sign,
        },
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        error: "Erro interno",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/shopee/refresh", async (_req, res) => {
    try {
      const partnerId = Number(String(process.env.SHOPEE_PARTNER_ID || "").trim());
      const partnerKey = String(process.env.SHOPEE_PARTNER_KEY || "").trim();
      const shopId = Number(String(process.env.SHOPEE_SHOP_ID || "").trim());
      const refreshToken = String(process.env.SHOPEE_REFRESH_TOKEN || "").trim();
      const baseUrl = String(process.env.SHOPEE_API_BASE_URL || "").trim();

      if (!partnerId || !partnerKey || !shopId || !refreshToken || !baseUrl) {
        return res.status(400).json({
          sucesso: false,
          error: "Verifique SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY, SHOPEE_SHOP_ID, SHOPEE_REFRESH_TOKEN e SHOPEE_API_BASE_URL no .env",
        });
      }

      const pathApi = "/api/v2/auth/access_token/get";
      const timestamp = Math.floor(Date.now() / 1000);
      const baseString = `${partnerId}${pathApi}${timestamp}`;
      const sign = createShopeeSign(baseString, partnerKey);

      const url = new URL(`${baseUrl}${pathApi}`);
      url.searchParams.set("partner_id", String(partnerId));
      url.searchParams.set("timestamp", String(timestamp));
      url.searchParams.set("sign", sign);

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
          shop_id: shopId,
          partner_id: partnerId,
        }),
      });

      const data = await response.json();

      return res.status(response.status).json({
        sucesso: !!data.access_token,
        data,
        debug: {
          requestUrl: url.toString(),
          baseString,
          sign,
        },
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        error: "Erro interno",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get("/api/shopee/orders", async (req, res) => {
    try {
      const partnerId = Number(String(process.env.SHOPEE_PARTNER_ID || "").trim());
      const partnerKey = String(process.env.SHOPEE_PARTNER_KEY || "").trim();
      const shopId = Number(String(process.env.SHOPEE_SHOP_ID || "").trim());
      const accessToken = String(process.env.SHOPEE_ACCESS_TOKEN || "").trim();
      const baseUrl = String(process.env.SHOPEE_API_BASE_URL || "").trim();

      if (!partnerId || !partnerKey || !shopId || !accessToken || !baseUrl) {
        return res.status(400).json({
          sucesso: false,
          error: "Verifique SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY, SHOPEE_SHOP_ID, SHOPEE_ACCESS_TOKEN e SHOPEE_API_BASE_URL no .env",
        });
      }

      const pathApi = "/api/v2/order/get_order_list";
      const timestamp = Math.floor(Date.now() / 1000);

      const timeRangeField = String(req.query.time_range_field || "create_time");
      const timeFrom = Number(req.query.time_from || Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60);
      const timeTo = Number(req.query.time_to || Math.floor(Date.now() / 1000));
      const pageSize = Number(req.query.page_size || 20);
      const cursor = String(req.query.cursor || "");

      const baseString = `${partnerId}${pathApi}${timestamp}${accessToken}${shopId}`;
      const sign = createShopeeSign(baseString, partnerKey);

      const url = new URL(`${baseUrl}${pathApi}`);
      url.searchParams.set("partner_id", String(partnerId));
      url.searchParams.set("timestamp", String(timestamp));
      url.searchParams.set("access_token", accessToken);
      url.searchParams.set("shop_id", String(shopId));
      url.searchParams.set("sign", sign);
      url.searchParams.set("time_range_field", timeRangeField);
      url.searchParams.set("time_from", String(timeFrom));
      url.searchParams.set("time_to", String(timeTo));
      url.searchParams.set("page_size", String(pageSize));

      if (cursor) {
        url.searchParams.set("cursor", cursor);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      return res.status(response.status).json({
        sucesso: response.ok,
        data,
        debug: {
          requestUrl: url.toString(),
          baseString,
          sign,
        },
      });
    } catch (error) {
      return res.status(500).json({
        sucesso: false,
        error: "Erro interno",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  const port = 3000;
  app.listen(port, () => {
    console.log(`Servidor em http://localhost:${port}`);
  });
}

startServer().catch(console.error);