/**
 * Pre-deploy check: `npm run check:env` (reads .env.local, or real env vars in CI).
 * Exits non-zero if production would be misconfigured.
 */
import { existsSync } from "node:fs";
import { checkEnv } from "../src/lib/env";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const { errors, warnings } = checkEnv(process.env, true);
for (const w of warnings) console.warn(`⚠️  ${w}`);
for (const e of errors) console.error(`❌ ${e}`);
if (errors.length) process.exit(1);
console.log("✅ Environment looks ready for production.");
