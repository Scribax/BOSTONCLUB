const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDatabase() {
  console.log("🧹 Iniciando limpieza de la base de datos...");

  try {
    // 1. Borramos todo el historial transaccional (hijos primero para no romper foreign keys)
    console.log("- Borrando Canjes (Redemptions)...");
    await prisma.redemption.deleteMany({});

    console.log("- Borrando Historial de Puntos...");
    await prisma.pointHistory.deleteMany({});

    console.log("- Borrando Notificaciones...");
    await prisma.notification.deleteMany({});

    console.log("- Borrando Transacciones POS...");
    await prisma.posTransaction.deleteMany({});

    console.log("- Borrando Visitas...");
    await prisma.visit.deleteMany({});

    // 2. Borramos los usuarios de prueba (clientes), pero MANTENEMOS a los ADMIN y STAFF
    console.log("- Borrando Usuarios de prueba (Clientes)...");
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        role: {
          notIn: ['ADMIN', 'STAFF']
        }
      }
    });
    console.log(`  ✅ ${deletedUsers.count} usuarios eliminados.`);

    // =========================================================================
    // OJO: NO BORRO PREMIOS (Rewards), EVENTOS (Events) ni CONFIGURACIONES.
    // Si borro eso, la app de tu jefe se vería vacía (sin banners ni nada).
    // Si igual querés borrarlos, descomentá las siguientes líneas:
    // =========================================================================
    
    // await prisma.reward.deleteMany({});
    // await prisma.event.deleteMany({});
    // await prisma.vipBenefit.deleteMany({});
    // await prisma.promoToken.deleteMany({});

    console.log("✨ ¡Base de datos limpia! Lista para el jefe.");

  } catch (error) {
    console.error("❌ Error limpiando la base de datos:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
