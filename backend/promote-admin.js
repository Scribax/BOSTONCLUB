require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const updated = await p.user.update({
    where: { email: 'francodemartosutn@gmail.com' },
    data: { role: 'ADMIN', lastName: 'De Marto' }
  });
  console.log('Usuario actualizado:', updated.firstName, updated.lastName, '| Rol:', updated.role);
  await p.$disconnect();
}

main().catch(console.error);
