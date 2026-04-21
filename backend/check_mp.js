require("dotenv/config");
const { MercadoPagoConfig, Payment } = require("mercadopago");

async function checkRecentPayments() {
  const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || "" 
  });
  
  const payment = new Payment(client);
  try {
    const result = await payment.search({
      options: {
        sort: "date_created",
        criteria: "desc",
        limit: 5
      }
    });
    
    console.log("\n--- ÚLTIMOS 5 PAGOS EN MERCADO PAGO ---");
    if (result.results && result.results.length > 0) {
      result.results.forEach(p => {
        console.log(`Pago ID: ${p.id}`);
        console.log(`Monto: $${p.transaction_amount} | Estado: ${p.status}`);
        console.log(`Fecha: ${p.date_created}`);
        console.log(`Order ID: ${p.order ? p.order.id : "N/A"}`);
        console.log(`External Reference: ${p.external_reference || "N/A"}`);
        console.log(`Terminal/Caja: ${p.point_of_interaction?.business_info?.unit || "N/A"}`);
        console.log("---------------------------------------");
      });
    } else {
      console.log("No se encontraron pagos recientes.");
    }
  } catch (error) {
    console.error("Error consultando pagos:", error);
  }
}

checkRecentPayments();
