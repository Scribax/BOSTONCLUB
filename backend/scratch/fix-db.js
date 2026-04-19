const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixPoints() {
  const rewards = await prisma.reward.findMany();
  console.log("REVISANDO PREMIOS:");
  
  for (const r of rewards) {
    if (r.pointsRequired < 0) {
      console.log(`- ¡ERROR ENCONTRADO! ${r.name} tiene ${r.pointsRequired}. Corrigiendo a positivo...`);
      await prisma.reward.update({
        where: { id: r.id },
        data: { pointsRequired: Math.abs(r.pointsRequired) }
      });
    } else {
      console.log(`- ${r.name}: ${r.pointsRequired} (OK)`);
    }
  }
}

fixPoints().catch(console.error).finally(() => prisma.$disconnect());
