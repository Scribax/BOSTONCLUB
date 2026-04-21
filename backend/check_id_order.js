require("dotenv/config");
const { MercadoPagoConfig, MerchantOrder } = require("mercadopago");

async function manualCheck() {
  const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || "" 
  });
  
  const order = new MerchantOrder(client);
  try {
    const data = await order.get({ merchantOrderId: "155795601824" });
    console.log("¡ORDEN ENCONTRADA! ID:", data.id, "Status:", data.status);
  } catch (error) {
    console.error("ERROR BUSCANDO ORDEN:", error.message);
  }
}

manualCheck();
