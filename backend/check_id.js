require("dotenv/config");
const { MercadoPagoConfig, Payment } = require("mercadopago");

async function manualCheck() {
  const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || "" 
  });
  
  const payment = new Payment(client);
  try {
    const data = await payment.get({ id: "155796938470" });
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("ERROR BUSCANDO PAGO:", error.message);
  }
}

manualCheck();

manualCheck();
