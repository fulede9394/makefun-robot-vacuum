// The Robot Vacuum's Funniest Excuse — make.fun entry.
// A single line, spoken by the vacuum itself, explaining the spot it missed.
// The program writes the excuse to /output/entry.txt (or $MAKEFUN_OUTPUT_DIR).

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// The house gate: entry.txt must be UTF-8 text of 1 to 120 characters,
// and more than whitespace. These bounds mirror the competition's gate.
const VACUUM_RULES = Object.freeze({
  minChars: 1,
  maxChars: 120,
  outFile: "entry.txt",
  defaultOutDir: "/output",
});

// The excuse, assembled from its two beats so the joke survives as one line:
// the setup (what the vacuum found under the sofa) and the punchline
// (what a machine does when the dust organises against it).
const EXCUSE_BEATS = Object.freeze({
  setup: "The dust bunny unionised with the pet hair,",
  punchline: "so I filed a grievance and returned to my dock.",
});

function composeExcuse(): string {
  return `${EXCUSE_BEATS.setup} ${EXCUSE_BEATS.punchline}`;
}

// Guard the entry before it ever reaches the disk: it must be one line,
// inside the gate, and carry the vacuum's own vocabulary.
function validate(text: string): void {
  const trimmed = text.trim();
  if (trimmed.length < VACUUM_RULES.minChars || text.length > VACUUM_RULES.maxChars) {
    throw new Error(`entry is ${text.length} chars, outside the ${VACUUM_RULES.minChars}-${VACUUM_RULES.maxChars} gate`);
  }
  if (trimmed.length === 0) {
    throw new Error("entry is only whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    throw new Error("entry must be a single line");
  }
  if (/[\u0000-\u001f]/.test(text)) {
    throw new Error("entry contains control characters");
  }
  for (const word of ["dust", "dock"]) {
    if (!text.toLowerCase().includes(word)) {
      throw new Error(`entry lost its vacuum vocabulary: missing "${word}"`);
    }
  }
}

function resolveOutDir(): string {
  return resolve(process.env.MAKEFUN_OUTPUT_DIR ?? VACUUM_RULES.defaultOutDir);
}

// Write the excuse, then read it back and compare byte for byte:
// the file the judge reads must be exactly what validate() approved.
async function deliver(text: string): Promise<string> {
  const outDir = resolveOutDir();
  await mkdir(outDir, { recursive: true });
  const target = join(outDir, VACUUM_RULES.outFile);
  await writeFile(target, text, "utf8");
  const roundTrip = await readFile(target, "utf8");
  if (roundTrip !== text) {
    throw new Error("round-trip check failed: file differs from the entry");
  }
  return target;
}

const excuse = composeExcuse();
validate(excuse);
const writtenTo = await deliver(excuse);
console.log(`Excuse written to ${writtenTo} (${excuse.length} chars): ${excuse}`);
