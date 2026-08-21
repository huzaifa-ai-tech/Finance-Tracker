import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const paise = (pkr) => Math.round(pkr * 100);

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      email: "demo@example.com",
      name: "Demo User",
      passwordHash: await bcrypt.hash("demo1234", 12),
    },
  });

  const c = {};
  for (const [name, type, color] of [
    ["Salary", "INCOME", "#34d399"],
    ["Freelance", "INCOME", "#22d3ee"],
    ["Investments", "INCOME", "#a78bfa"],
    ["Rent", "EXPENSE", "#f87171"],
    ["Groceries", "EXPENSE", "#fbbf24"],
    ["Transport", "EXPENSE", "#60a5fa"],
    ["Utilities", "EXPENSE", "#4ade80"],
    ["Dining Out", "EXPENSE", "#f472b6"],
    ["Entertainment", "EXPENSE", "#c084fc"],
    ["Health", "EXPENSE", "#fb7185"],
    ["Shopping", "EXPENSE", "#38bdf8"],
  ]) {
    c[name] = await prisma.category.create({ data: { userId: user.id, name, type, color } });
  }

  const budgets = [
    { userId: user.id, categoryId: c["Rent"].id, monthlyLimit: paise(45000) },
    { userId: user.id, categoryId: c["Groceries"].id, monthlyLimit: paise(20000) },
    { userId: user.id, categoryId: c["Transport"].id, monthlyLimit: paise(7000) },
    { userId: user.id, categoryId: c["Utilities"].id, monthlyLimit: paise(12000) },
    { userId: user.id, categoryId: c["Dining Out"].id, monthlyLimit: paise(9000) },
    { userId: user.id, categoryId: c["Entertainment"].id, monthlyLimit: paise(6000) },
    { userId: user.id, categoryId: c["Shopping"].id, monthlyLimit: paise(12000) },
  ];
  for (const b of budgets) {
    await prisma.budget.create({ data: b });
  }

  const rand = mulberry32(42);
  const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

  const now = new Date();
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  for (let offset = 5; offset >= 0; offset--) {
    const year = currentMonthStart.getUTCFullYear();
    const month = currentMonthStart.getUTCMonth() - offset;
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const at = (day) => new Date(Date.UTC(year, month, day, 12));

    const adds = [
      { cat: c["Salary"], day: 1, amount: paise(150000), note: "Monthly salary" },
      { cat: c["Rent"], day: 3, amount: paise(45000), note: "Apartment rent" },
      { cat: c["Utilities"], day: 5, amount: paise(randInt(9000, 13000)), note: null },
    ];

    for (let i = 0; i < 3; i++) {
      adds.push({ cat: c["Groceries"], day: randInt(2, daysInMonth), amount: paise(randInt(2500, 7000)), note: null });
    }
    for (let i = 0; i < 3; i++) {
      adds.push({ cat: c["Transport"], day: randInt(2, daysInMonth), amount: paise(randInt(350, 2000)), note: null });
    }
    for (let i = 0; i < 2; i++) {
      adds.push({ cat: c["Dining Out"], day: randInt(2, daysInMonth), amount: paise(randInt(1200, 4500)), note: null });
    }
    for (let i = 0; i < randInt(1, 2); i++) {
      adds.push({ cat: c["Entertainment"], day: randInt(2, daysInMonth), amount: paise(randInt(800, 4000)), note: null });
    }
    if (rand() > 0.3) {
      adds.push({ cat: c["Shopping"], day: randInt(2, daysInMonth), amount: paise(randInt(2500, 15000)), note: null });
    }
    if (offset > 0 && rand() > 0.4) {
      adds.push({ cat: c["Freelance"], day: randInt(8, daysInMonth), amount: paise(randInt(15000, 60000)), note: "Freelance project" });
    }
    if (rand() > 0.5) {
      adds.push({ cat: c["Health"], day: randInt(2, daysInMonth), amount: paise(randInt(1000, 6000)), note: null });
    }

    adds.sort((a, b) => a.day - b.day);
    for (const a of adds) {
      await prisma.transaction.create({
        data: { userId: user.id, categoryId: a.cat.id, amount: a.amount, date: at(a.day), note: a.note },
      });
    }
  }

  console.log("Seeded demo user demo@example.com / demo1234 with categories, budgets and 6 months of transactions.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());