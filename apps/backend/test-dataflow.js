// Full data flow verification test
const http = require("http");

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "127.0.0.1", port: 4000,
      path: `/api/v1${path}`, method,
      headers: {
        ...(data && { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  console.log("=== ArtVerse Data Flow Diagnostic ===\n");

  // 1. Login as seller
  const login = await request("POST", "/auth/login", { email: "priya@artverse.com", password: "Password@123" });
  const token = login.data.data.tokens.accessToken;
  const userId = login.data.data.user.id;
  console.log(`✅ Logged in as: ${login.data.data.user.name} (${userId})\n`);

  // 2. Check the portfolio query — what the artist page fetches
  console.log("--- Portfolio Query: GET /products?sellerId=<userId> ---");
  const portfolio = await request("GET", `/products?sellerId=${userId}`, null, token);
  console.log(`Status: ${portfolio.status}`);
  console.log(`Products found: ${portfolio.data.data?.length || 0}`);
  if (portfolio.data.data?.length > 0) {
    portfolio.data.data.forEach((p) => {
      console.log(`  → [${p.isApproved ? '✅ APPROVED' : '❌ NOT APPROVED'}] ${p.title} (${p.id})`);
    });
  }

  // 3. Check the SAME query WITHOUT isApproved filter (all products)
  console.log("\n--- All Products for User (including unapproved): GET /products?sellerId=<userId>&isApproved=false ---");
  const allProducts = await request("GET", `/products?sellerId=${userId}&isApproved=false`, null, token);
  console.log(`Status: ${allProducts.status}`);
  console.log(`Products found: ${allProducts.data.data?.length || 0}`);
  if (allProducts.data.data?.length > 0) {
    allProducts.data.data.forEach((p) => {
      console.log(`  → [${p.isApproved ? '✅ APPROVED' : '❌ NOT APPROVED'}] ${p.title} (${p.id})`);
    });
  }

  // 4. Check the uploaded test product from our earlier test
  console.log("\n--- Searching for 'Test Artwork' ---");
  const search = await request("GET", `/products?search=Test+Artwork`, null, token);
  console.log(`Found via search (approved only): ${search.data.data?.length || 0}`);

  const searchAll = await request("GET", `/products?search=Test+Artwork&isApproved=false`, null, token);
  console.log(`Found via search (unapproved only): ${searchAll.data.data?.length || 0}`);
  if (searchAll.data.data?.length > 0) {
    searchAll.data.data.forEach((p) => {
      console.log(`  → [${p.isApproved ? '✅ APPROVED' : '❌ NOT APPROVED'}] ${p.title}`);
    });
  }

  // 5. Test profile update flow
  console.log("\n--- Profile Update: PUT /users/me ---");
  const updateRes = await request("PUT", "/users/me", { name: "Priya Sharma Updated", bio: "Updated bio for testing" }, token);
  console.log(`Update Status: ${updateRes.status}`);
  console.log(`Returned name: ${updateRes.data.data?.name}`);
  console.log(`Returned bio: ${updateRes.data.data?.bio}`);

  // 6. Fetch /auth/me to see if fetchMe returns updated data
  console.log("\n--- Auth Me Check: GET /auth/me ---");
  const me = await request("GET", "/auth/me", null, token);
  console.log(`Me name: ${me.data.data?.name}`);
  console.log(`Me bio: ${me.data.data?.bio}`);
  console.log(`Me has bio field: ${me.data.data?.hasOwnProperty('bio')}`);

  // 7. Restore original name
  await request("PUT", "/users/me", { name: "Priya Sharma" }, token);
  console.log("\n✅ Restored original name");

  console.log("\n=== Diagnostic Complete ===");
})();
