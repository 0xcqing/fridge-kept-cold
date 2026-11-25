import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROAST =
  "My fridge has a touchscreen, a camera and a voice assistant, and the only thing it has ever actually kept cold is my opinion of it.";

type RoastFacts = {
  roast: string;
  characters: number;
  bytes: number;
  lines: number;
};

function roastFacts(text: string): RoastFacts {
  return {
    roast: text,
    characters: Array.from(text).length,
    bytes: Buffer.byteLength(text, "utf8"),
    lines: text.length === 0 ? 0 : text.split("\n").length,
  };
}

function fail(message: string): never {
  process.stderr.write(`entry.txt: ${message}\n`);
  process.exit(1);
}

function validate(text: string): RoastFacts {
  const facts = roastFacts(text);

  if (facts.characters < 1 || facts.characters > 200) {
    fail(`characters must be 1..200, got ${facts.characters}`);
  }
  if (facts.bytes < 1 || facts.bytes > 200) {
    fail(`bytes must be 1..200, got ${facts.bytes}`);
  }
  if (text.trim().length === 0) {
    fail("line is empty after trimming");
  }
  if (/^\s|\s$/.test(text)) {
    fail("line has leading or trailing whitespace");
  }
  if (text.includes("\n") || text.includes("\r")) {
    fail("line must not contain a newline");
  }
  if (facts.lines !== 1) {
    fail(`line count must be 1, got ${facts.lines}`);
  }

  return facts;
}

const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const filePath = join(outputDir, "entry.txt");
const facts = validate(ROAST);
const payload = Buffer.from(ROAST + "\n", "utf8");

mkdirSync(outputDir, { recursive: true });
try {
  chmodSync(outputDir, 0o755);
} catch {
  // The sandbox's output directory may already be owned by another user.
}

writeFileSync(filePath, payload);
try {
  chmodSync(filePath, 0o644);
} catch {
  // Leave the file readable where chmod is not permitted.
}

const readBack = readFileSync(filePath);
if (!readBack.equals(payload)) {
  fail("read-back bytes do not match written bytes");
}

const printed = roastFacts(facts.roast);
process.stdout.write(
  `${filePath}\ncharacters: ${printed.characters}\nbytes: ${printed.bytes}\nlines: ${printed.lines}\n`,
);
