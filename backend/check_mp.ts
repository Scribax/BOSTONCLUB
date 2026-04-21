import "dotenv/config";
import { MercadoPagoConfig, Payment } from "mercadopago";

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
    
    console.log("Últimos 5 pagos recibidos en esta cuenta de MP:");
    result.results?.forEach(p => {
      console.log(`- Pago ID: ${p.id} | Estado: ${p.status} | Monto: ${p.transaction_amount} | Fecha: ${p.date_created}`);
      console.log(`  > Order ID: ${p.order?.id || "N/A"}`);
      console.log(`  > External Reference: ${p.external_reference || "N/A"}`);
      console.log(`  > POS / Terminal: ${p.point_of_interaction?.business_info?.unit || "N/A"}`);
      console.log("---");
    });
  } catch (error) {
    console.error("Error consultando pagos:", error);
  }
}

checkRecentPayments();
