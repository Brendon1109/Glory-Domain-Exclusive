// Side-effect module: load .env.local before any DB module is imported.
// (ESM evaluates imported modules in source order, so importing this FIRST
// guarantees process.env is populated before src/db/index.ts creates its pool.)
import { config } from "dotenv";

config({ path: ".env.local" });
