import { Client } from "@elastic/elasticsearch";

const esClient = new Client({
  node: "https://localhost:9200", // Change from HTTP to HTTPS
  auth: { username: "elastic", password: "pass@123" }, // Ensure correct credentials
  tls: {
    rejectUnauthorized: false, // Ignore self-signed SSL issues (Only for local dev)
  },
});

export default esClient;
