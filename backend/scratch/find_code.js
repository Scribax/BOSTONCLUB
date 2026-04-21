const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'mybostonclub@gmail.com' },
    select: { verificationCode: true, resetCode: true }
  });
  console.log('--- CODIGOS ENCONTRADOS ---');
  console.log('Email:', 'mybostonclub@gmail.com');
  console.log('Código de Verificación:', user?.verificationCode || 'No encontrado');
  console.log('Código de Recuperación:', user?.resetCode || 'No encontrado');
  console.log('---------------------------');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
