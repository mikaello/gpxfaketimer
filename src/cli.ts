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

const fail = (message: string): never => {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
};

const parseTime = (value: string): number => {
  if (value.trim() === "") {
    fail("Invalid date/time: value is empty.");
  }
  const asNumber = Number(value);
  if (Number.isFinite(asNumber)) return asNumber;
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) {
    fail(`Invalid date/time: ${value}`);
  }
  return d.getTime();
};

const inputFile = positionals[0];
const gpxContent = (() => {
  try {
    return readFileSync(inputFile, "utf-8");
  } catch {
    return fail(`could not read file "${inputFile}"`);
  }
})();

const startTime =
  values.start !== undefined ? parseTime(values.start) : Date.now();

let result: string;
if (values.speed !== undefined) {
  const speed = Number(values.speed);
  if (!Number.isFinite(speed) || speed <= 0) {
    fail("--speed must be a positive finite number.");
  }
  if (
    values.unit !== undefined &&
    values.unit !== "mph" &&
    values.unit !== "kmh"
  ) {
    fail('--unit must be "kmh" or "mph".');
  }
  const unit = values.unit === "mph" ? "mph" : "kmh";
  result = createTimestampsFromSpeed(gpxContent, startTime, speed, unit);
} else {
  if (values.unit !== undefined) {
    fail("--unit requires --speed.");
  }
  const endTime = values.end !== undefined
    ? parseTime(values.end)
    : startTime + 60 * 60 * 1000;
  if (endTime < startTime) {
    fail("--end must be at or after --start.");
  }
  result = createTimestampsEvenly(gpxContent, startTime, endTime);
}

if (values.output) {
  writeFileSync(values.output, result, "utf-8");
} else {
  process.stdout.write(result + "\n");
}
