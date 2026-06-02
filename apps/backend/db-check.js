require("dotenv").config({ path: "../../.env.local" });
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

async function testConnection() {
  const prisma = new PrismaClient();
  try {
    const users = await prisma.user.findMany({ take: 1 });
    fs.writeFileSync(
      "db-check.json",
      JSON.stringify({ success: true, count: users.length }),
    );
  } catch (error) {
    fs.writeFileSync(
      "db-check.json",
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
