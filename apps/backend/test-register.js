const http = require("http");

const data = JSON.stringify({
  name: "Test User",
  email: "test@example.com",
  password: "TestPass123",
  role: "BUYER",
});

const options = {
  hostname: "127.0.0.1",
  port: 4000,
  path: "/api/v1/auth/register",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let responseData = "";
  res.on("data", (chunk) => {
    responseData += chunk;
  });
  res.on("end", () => {
    const parsed = JSON.parse(responseData);
    console.log(`SUCCESS: ${parsed.success}`);
    console.log(`MESSAGE: ${parsed.message}`);
    if (parsed.data?.user) {
      console.log(`USER: ${parsed.data.user.name} (${parsed.data.user.email}) - ${parsed.data.user.role}`);
      console.log(`HAS TOKENS: ${!!parsed.data.tokens?.accessToken}`);
    }
  });
});

req.on("error", (error) => {
  console.error(error);
});

req.write(data);
req.end();
