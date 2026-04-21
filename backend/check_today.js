require("dotenv/config");
const { MercadoPagoConfig, Payment } = require("mercadopago");

async function checkTodayPayments() {
  const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || "" 
  });
  
  const payment = new Payment(client);
  try {
    const today = new Date();
    today.setHours(0,0,0,0);
    const dateQuery = today.toISOString();
    
    // Solo buscamos los últimos 10 de hoy en adelante para evitar los viejos
    const result = await payment.search({
      options: {
        sort: "date_created",
        criteria: "desc",
        range: "date_created",
        begin_date: "2026-04-20T00:00:00Z",
        end_date: "2026-04-22T00:00:00Z",
        limit: 10
      }
    });
    
    console.log("\n--- PAGOS DE HOY EN MERCADO PAGO ---");
    if (result.results && result.results.length > 0) {
      result.results.forEach(p => {
        console.log(`Pago ID: ${p.id} | Monto: $${p.transaction_amount} | Estado: ${p.status}`);
        console.log(`Tipo: ${p.payment_type_id} | Metodo: ${p.payment_method_id}`);
        console.log(`External Reference: ${p.external_reference || "N/A"}`);
        console.log(`Terminal/Caja: ${p.point_of_interaction?.business_info?.unit || "N/A"}`);
        console.log("---");
      });
    } else {
      console.log("No se encontraron pagos del día de hoy.");
    }
  } catch (error) {
    console.error("Error consultando pagos de hoy:", error.message);
  }
}

checkTodayPayments();
