const z = require("zod");
console.log("'false' string ->", z.coerce.boolean().parse("false"));
console.log("'true' string  ->", z.coerce.boolean().parse("true"));
console.log("'' empty       ->", z.coerce.boolean().parse(""));
