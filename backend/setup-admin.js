require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando configuración inicial del Boston Club...');

  try {
    // 1. Crear o actualizar el Administrador Maestro
    const adminEmail = 'francodemartosutn@gmail.com';
    const rawPassword = 'boston2026';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        role: 'ADMIN',
        firstName: 'Franco',
        lastName: 'De Marto',
      },
      create: {
        dni: '0', // DNI temporal para el admin
        firstName: 'Franco',
        lastName: 'De Marto',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        membershipLevel: 'SÚPER VIP',
        points: 0,
      },
    });

    console.log(`✅ Administrador configurado: ${admin.email}`);
    console.log(`🔑 Contraseña establecida: ${rawPassword}`);

    // 2. Inicializar Configuración del Club (Singleton)
    const settings = await prisma.clubSettings.upsert({
      where: { id: 'singleton' },
      update: {}, // No cambiar si ya existen
      create: {
        id: 'singleton',
        vipThreshold: 1000,
        checkinPoints: 100,
        goldThreshold: 500000,
        platinumThreshold: 1500000,
        diamondThreshold: 5000000,
        superVipThreshold: 10000000,
        bronceBenefits: '- Beneficios base de socio\n- Acceso a promociones',
        goldBenefits: '- 10% Off en toda la carta\n- Mesa reservada los findes',
        platinumBenefits: '- 20% Off en toda la carta\n- Acceso anticipado a eventos',
        diamondBenefits: '- 30% Off en toda la carta\n- Zona VIP sin cargo\n- Regalo de cumpleaños',
        superVipBenefits: '- 50% Off en toda la carta\n- Todo incluido en eventos seleccionados\n- Concierge privado',
      },
    });

    console.log('✅ Configuración del club (ClubSettings) inicializada.');
    console.log('✨ Proceso completado exitosamente. Ya puedes iniciar sesión.');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
