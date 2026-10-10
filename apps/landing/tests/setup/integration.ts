import { config } from "dotenv";

// Load .env.local/.env for the integration process, mirroring the Next.js order.
config({ path: [".env.local", ".env"], quiet: true });

export {};
