const http = require("http");

const data = JSON.stringify({
  email: "admin@artverse.com",
  password: "Password@123",
});

const options = {
  hostname: "127.0.0.1",
  port: 4000,
  path: "/api/v1/auth/login",
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
    console.log(`RESPONSE: ${responseData}`);
  });
});

req.on("error", (error) => {
  console.error(error);
});

req.write(data);
req.end();
