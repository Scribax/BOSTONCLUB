require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function fix() {
  // Fix any user with "undefined" or empty lastName
  const r1 = await p.user.updateMany({
    where: { lastName: 'undefined' },
    data: { lastName: '' }
  });
  console.log('Fixed undefined lastName:', r1.count, 'users');

  // Also list all users
  const users = await p.user.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, role: true }
  });
  console.log('All users:', JSON.stringify(users, null, 2));
  
  await p.$disconnect();
}

fix().catch(console.error);
