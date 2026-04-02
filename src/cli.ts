#!/usr/bin/env node
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { createTimestampsEvenly, createTimestampsFromSpeed } from "./index.js";

// Polyfill browser DOM APIs for Node.js
(globalThis as unknown as Record<string, unknown>).DOMParser = DOMParser;
(globalThis as unknown as Record<string, unknown>).XMLSerializer = XMLSerializer;

const HELP = `\
Usage: gpxfaketimer <input.gpx> [options]

Options:
  --output, -o <file>   Output file (default: stdout)
  --start <datetime>    Start time as ISO 8601 or Unix ms (default: now)
  --speed <number>      Speed for distance-based timing
  --unit <kmh|mph>      Speed unit, requires --speed (default: kmh)
  --end <datetime>      End time for evenly distributed mode (ISO 8601 or Unix ms)
  --help, -h            Show this help

If --speed is provided, timestamps are calculated from GPS distances at that speed.
Otherwise, timestamps are evenly distributed between --start and --end (default: 1 hour).
`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    output: { type: "string", short: "o" },
    start: { type: "string" },
    end: { type: "string" },
    speed: { type: "string" },
    unit: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});

if (values.help) {
  process.stdout.write(HELP);
  process.exit(0);
}

if (positionals.length === 0) {
  process.stderr.write("Error: input GPX file is required.\n\n" + HELP);
  process.exit(1);
}

const parseTime = (value: string): number => {
  const asNumber = Number(value);
  if (!isNaN(asNumber)) return asNumber;
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    throw new Error(`Invalid date/time: ${value}`);
  }
  return d.getTime();
};

const inputFile = positionals[0];
let gpxContent: string;
try {
  gpxContent = readFileSync(inputFile, "utf-8");
} catch {
  process.stderr.write(`Error: could not read file "${inputFile}"\n`);
  process.exit(1);
  throw new Error(); // unreachable, satisfies TS definite assignment
}

const startTime = values.start ? parseTime(values.start) : Date.now();

let result: string;
if (values.speed !== undefined) {
  const speed = parseFloat(values.speed);
  if (isNaN(speed) || speed <= 0) {
    process.stderr.write("Error: --speed must be a positive number.\n");
    process.exit(1);
  }
  const unit = values.unit === "mph" ? "mph" : "kmh";
  result = createTimestampsFromSpeed(gpxContent, startTime, speed, unit);
} else {
  const endTime = values.end
    ? parseTime(values.end)
    : startTime + 60 * 60 * 1000;
  result = createTimestampsEvenly(gpxContent, startTime, endTime);
}

if (values.output) {
  writeFileSync(values.output, result, "utf-8");
} else {
  process.stdout.write(result + "\n");
}
