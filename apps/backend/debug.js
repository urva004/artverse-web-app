import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    const data = {
      title: "digital art modified",
      description: "this is my first digital artwork",
      price: "699",
      stock: "1",
      category: "DIGITAL_ART",
    };

    if (data.price) data.price = Number(data.price);
    if (data.stock) data.stock = Number(data.stock);

    const product = await prisma.artProduct.update({
      where: { id: "cmoclfr89000nsxfq1oniqhlx" },
      data: {
        ...data,
      },
    });

    console.log("Success:", product);
  } catch (e) {
    console.error("Prisma error:", e);
  }
}

test();
