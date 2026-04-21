require("dotenv/config");
const axios = require("axios");

async function checkAccount() {
  try {
    const res = await axios.get("https://api.mercadopago.com/users/me", {
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
      }
    });
    console.log("=== DATOS DE LA CUENTA MERCADO PAGO ===");
    console.log(`ID Cuenta: ${res.data.id}`);
    console.log(`Nombre: ${res.data.first_name} ${res.data.last_name}`);
    console.log(`Email: ${res.data.email}`);
  } catch (error) {
    console.error("Error obteniendo cuenta:", error.response ? error.response.data : error.message);
  }
}

checkAccount();
