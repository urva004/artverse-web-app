const Redis = require("ioredis");
const redis = new Redis(process.env.REDIS_URL || "rediss://default:Aev-AAIncDE4ZDcwZDUyN2RmOTk0OGQ4OWQ1OGY5ZTAyMGY0ZTMyZXAxNjA0MTQ@enabled-spider-60414.upstash.io:6379", { maxRetriesPerRequest: 1 });
redis.on("error", (err) => console.log("Redis Error:", err.message));
redis.ping().then(res => { console.log("Redis Ping:", res); process.exit(0); }).catch(e => { console.log("Ping Failed"); process.exit(1); });
setTimeout(() => { console.log("Timeout"); process.exit(1); }, 3000);
