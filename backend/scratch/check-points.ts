import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkRewards() {
  const rewards = await prisma.reward.findMany();
  console.log("REWARDS IN DB:");
  rewards.forEach(r => {
    console.log(`- ${r.name}: ${r.pointsRequired} points (Type: ${typeof r.pointsRequired})`);
  });
  
  const redemptions = await prisma.redemption.findMany({ include: { reward: true } });
  console.log("\nREDEMPTIONS IN DB:");
  redemptions.forEach(red => {
    console.log(`- ID: ${red.id}, Status: ${red.status}, Reward Cost: ${red.reward.pointsRequired}`);
  });
}

checkRewards().catch(console.error);
