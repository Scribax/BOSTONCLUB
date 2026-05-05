import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const flags = [
    { name: 'enable_referrals', description: 'Activar el sistema de referidos en la app móvil', enabled: true },
    { name: 'enable_new_rewards', description: 'Mostrar los nuevos premios experimentales', enabled: false },
    { name: 'enable_qr_promotions', description: 'Permitir escaneo de QR para promociones flash', enabled: true },
    { name: 'enable_experimental_ui', description: 'Activar la interfaz de usuario cyberpunk en la app', enabled: false },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { name: flag.name },
      update: {},
      create: flag,
    });
    console.log(`Upserted feature flag: ${flag.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
