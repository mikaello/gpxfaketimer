import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

test("CLI rejects invalid timing options", () => {
  const directory = mkdtempSync(join(tmpdir(), "gpxfaketimer-test-"));
  try {
    const input = join(directory, "input.gpx");
    writeFileSync(
      input,
      '<gpx><trk><trkseg><trkpt lat="0" lon="0"/></trkseg></trk></gpx>',
    );

    for (const [args, message] of [
      [["--speed", "10fast"], "--speed must be a positive finite number"],
      [["--speed", "10", "--unit", "knots"], '--unit must be "kmh" or "mph"'],
      [["--start", "100", "--end", "0"], "--end must be at or after --start"],
    ] as const) {
      const result = spawnSync(process.execPath, ["dist/cli.js", input, ...args], {
        cwd: process.cwd(),
        encoding: "utf8",
      });
      assert.strictEqual(result.status, 1);
      assert.ok(result.stderr.includes(message), result.stderr);
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
