const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando siembra de Feature Flags...');
  
  const flags = [
    { 
      name: 'theme_argentina', 
      enabled: false, 
      description: 'Modo Selección Argentina (Celeste, Blanco y Dorado)' 
    },
    { 
      name: 'theme_halloween', 
      enabled: false, 
      description: 'Modo Halloween (Naranja, Púrpura y Negro)' 
    },
    { 
      name: 'theme_christmas', 
      enabled: false, 
      description: 'Modo Navidad (Rojo, Verde y Blanco)' 
    }
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { name: flag.name },
      update: {},
      create: flag,
    });
    console.log(`✅ Flag configurada: ${flag.name}`);
  }

  console.log('🚀 Todas las flags de temas han sido creadas.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
