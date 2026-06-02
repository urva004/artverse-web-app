import { createProductSchema } from "../../packages/utils/src/validators/index.ts";

const reqBody = {
  title: "digital art modified",
  description: "this is my first digital artwork",
  price: "699",
  stock: "1",
  category: "DIGITAL_ART",
  tags: "[\"digital art\"]"
};

// mimic preprocessMultipart
if (reqBody.price) reqBody.price = Number(reqBody.price);
if (reqBody.stock) reqBody.stock = Number(reqBody.stock);
if (typeof reqBody.tags === "string") {
  reqBody.tags = JSON.parse(reqBody.tags);
}

const updateSchema = createProductSchema.partial();
const result = updateSchema.safeParse(reqBody);

if (!result.success) {
  console.log("Validation Failed:", result.error.errors);
} else {
  console.log("Validation Success:", result.data);
}
