const http = require("http");

const options = {
  hostname: "localhost",
  port: 4000,
  path: "/api/v1/auth/register",
  method: "OPTIONS",
  headers: {
    Origin: "http://localhost:3000",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "Content-Type",
  },
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers, null, 2)}`);
});

req.on("error", (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
