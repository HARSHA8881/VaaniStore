/**
 * Runs the real extraction (same code as /api/extract) over eval/transcripts.json
 * and reports per-field accuracy, field-level F1, hallucinations and latency.
 *
 *   npm run eval                 # all 30 cases
 *   npm run eval -- --limit 5    # quick check
 *   npm run eval -- --delay 4000 # slow down for free-tier rate limits (ms between calls)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_FALLBACK_MODEL, DEFAULT_MODEL, geminiGenerator } from "../src/lib/ai/llm";
import { extractShopProfile, LlmExtractResponseShape } from "../src/lib/extract";
import { f1, FIELDS, scoreCase, sumCounts, type CaseScore, type EvalCase } from "./score";

const here = dirname(fileURLToPath(import.meta.url));
const envFile = join(here, "..", ".env.local");
if (existsSync(envFile)) process.loadEnvFile(envFile);

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? Number(process.argv[i + 1]) : fallback;
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set. Add it to .env.local first.");
    process.exit(1);
  }
  const all = JSON.parse(readFileSync(join(here, "transcripts.json"), "utf8")) as EvalCase[];
  const cases = all.slice(0, arg("limit", all.length));
  const delay = arg("delay", 1500);
  const generate = geminiGenerator(LlmExtractResponseShape);

  const scores: (CaseScore & { language: string; latencyMs: number; attempts: number })[] = [];
  const failures: { id: string; error: string }[] = [];

  for (const [i, c] of cases.entries()) {
    process.stdout.write(`[${i + 1}/${cases.length}] ${c.id} … `);
    const started = performance.now();
    try {
      const result = await extractShopProfile(c.transcript, generate);
      const latencyMs = Math.round(performance.now() - started);
      const s = scoreCase(c, result.profile);
      scores.push({ ...s, language: c.language, latencyMs, attempts: result.attempts });
      console.log(
        `${latencyMs} ms${result.attempts > 1 ? " (retried)" : ""}${s.notes.length ? ` · ${s.notes.length} issue(s)` : " ✓"}`,
      );
    } catch (e) {
      failures.push({ id: c.id, error: (e as Error).message });
      console.log(`FAILED: ${(e as Error).message}`);
    }
    if (i < cases.length - 1) await new Promise((r) => setTimeout(r, delay));
  }

  const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

  // Per-field table, overall and by language.
  const groups = ["all", "en", "hi", "hinglish"] as const;
  const fieldRows = FIELDS.map((field) => {
    const row: Record<string, string> = { field };
    for (const g of groups) {
      const subset = scores.filter((s) => g === "all" || s.language === g);
      if (!subset.length) continue;
      row[`accuracy (${g})`] = pct(subset.filter((s) => s.correct[field]).length / subset.length);
    }
    const counts = sumCounts(scores.map((s) => s.counts[field]));
    row.F1 = pct(f1(counts).f1);
    row.hallucinations = String(counts.hallucinations);
    return row;
  });

  const overall = sumCounts(scores.flatMap((s) => FIELDS.map((f) => s.counts[f])));
  const { precision, recall, f1: overallF1 } = f1(overall);
  const latencies = scores.map((s) => s.latencyMs).sort((a, b) => a - b);
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
  const p95 = latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))] ?? 0;

  console.log("\nPer-field results");
  console.table(fieldRows);
  console.log("Overall field-level", {
    precision: pct(precision),
    recall: pct(recall),
    F1: pct(overallF1),
    hallucinations: overall.hallucinations,
    avgLatencyMs: Math.round(avgLatency),
    p95LatencyMs: p95,
    retried: scores.filter((s) => s.attempts > 1).length,
    failed: failures.length,
  });

  const withIssues = scores.filter((s) => s.notes.length);
  if (withIssues.length) {
    console.log("\nFailure cases");
    for (const s of withIssues) console.log(`- ${s.id}: ${s.notes.join("; ")}`);
  }

  const out = {
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    fallbackModel: process.env.GEMINI_FALLBACK_MODEL ?? DEFAULT_FALLBACK_MODEL,
    ranAt: new Date().toISOString(),
    cases: cases.length,
    overall: { precision, recall, f1: overallF1, ...overall },
    latency: { avgMs: Math.round(avgLatency), p95Ms: p95 },
    fields: fieldRows,
    failures,
    perCase: scores,
  };
  writeFileSync(join(here, "results.json"), JSON.stringify(out, null, 2));
  console.log("\nSaved eval/results.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
