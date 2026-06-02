const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const minRating = 4;
  try {
    const aggregations = await prisma.review.groupBy({
      by: ['productId'],
      having: {
        rating: { _avg: { gte: minRating } }
      }
    });
    console.log("Valid Product IDs:", aggregations.map(a => a.productId));
  } catch (err) {
    console.error("Query Failed:", err.message);
  }
}
main().finally(() => prisma.$disconnect());
