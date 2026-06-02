// Test the product upload endpoint end-to-end
const http = require("http");
const fs = require("fs");
const path = require("path");

// Step 1: Login as seller to get a token
function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: "priya@artverse.com",
      password: "Password@123",
    });
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 4000,
        path: "/api/v1/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": data.length },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          const parsed = JSON.parse(body);
          if (parsed.success) {
            console.log("✅ Login OK — got token for:", parsed.data.user.email);
            resolve(parsed.data.tokens.accessToken);
          } else {
            reject(new Error("Login failed: " + parsed.message));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// Step 2: Upload a product with a tiny test image
function uploadProduct(token) {
  return new Promise((resolve, reject) => {
    const boundary = "----TestBoundary" + Date.now();

    // Create a minimal 1x1 red PNG (68 bytes)
    const pngBuffer = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      "base64"
    );

    // Build multipart body
    let body = "";
    const fields = {
      title: "Test Artwork Upload",
      description: "This is a test artwork to verify the upload pipeline works end-to-end",
      price: "1500",
      stock: "5",
      category: "PAINTINGS",
      tags: JSON.stringify(["test", "debug"]),
    };

    for (const [key, value] of Object.entries(fields)) {
      body += `--${boundary}\r\n`;
      body += `Content-Disposition: form-data; name="${key}"\r\n\r\n`;
      body += `${value}\r\n`;
    }

    // Image field
    const imageHeader =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="images"; filename="test.png"\r\n` +
      `Content-Type: image/png\r\n\r\n`;
    const imageFooter = `\r\n--${boundary}--\r\n`;

    const bodyStart = Buffer.from(body + imageHeader, "utf-8");
    const bodyEnd = Buffer.from(imageFooter, "utf-8");
    const fullBody = Buffer.concat([bodyStart, pngBuffer, bodyEnd]);

    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: 4000,
        path: "/api/v1/products",
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": fullBody.length,
          Authorization: `Bearer ${token}`,
        },
      },
      (res) => {
        let responseBody = "";
        res.on("data", (chunk) => (responseBody += chunk));
        res.on("end", () => {
          console.log(`\nSTATUS: ${res.statusCode}`);
          try {
            const parsed = JSON.parse(responseBody);
            console.log("SUCCESS:", parsed.success);
            console.log("MESSAGE:", parsed.message || "N/A");
            if (parsed.errors) console.log("ERRORS:", JSON.stringify(parsed.errors, null, 2));
            if (parsed.data?.id) console.log("PRODUCT ID:", parsed.data.id);
            if (!parsed.success) console.log("FULL RESPONSE:", responseBody);
          } catch {
            console.log("RAW RESPONSE:", responseBody.substring(0, 500));
          }
          resolve();
        });
      }
    );
    req.on("error", (err) => {
      console.error("REQUEST ERROR:", err.message);
      reject(err);
    });
    req.write(fullBody);
    req.end();
  });
}

(async () => {
  try {
    console.log("=== ArtVerse Upload Debug Test ===\n");
    const token = await login();
    console.log("\n--- Testing POST /api/v1/products ---");
    await uploadProduct(token);
  } catch (err) {
    console.error("FATAL:", err.message);
  }
})();
