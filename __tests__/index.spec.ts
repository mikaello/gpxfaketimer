import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createTimestampsEvenly, getUniformDistribution } from "../src/index.ts";

const startExampleTime = 1588100000000;
const endExampleTime = 1588490300000;

// <?xml version="1.0" encoding="UTF-8"?>
const createGpxWithOneTrackPoint = (time: string = "") => {
  return `
<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.0">
  <name>Example gpx</name>
  <trk><name>Example gpx</name><number>1</number><trkseg>
    <trkpt lat="46.57608333" lon="8.89241667"><ele>2376</ele>${time}</trkpt>
  </trkseg></trk>
</gpx>`.trim();
};

const createGpxWithFiveTrackPoints = (
  time1: string = "",
  time2: string = "",
  time3: string = "",
  time4: string = "",
  time5: string = "",
) => {
  return `
<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.0">
  <name>Example gpx</name>
  <trk><name>Example gpx</name><number>1</number><trkseg>
    <trkpt lat="46.57608333" lon="8.89241667"><ele>2376</ele>${time1}</trkpt>
	  <trkpt lat="46.57619444" lon="8.89252778"><ele>2375</ele>${time2}</trkpt>
	  <trkpt lat="46.57641667" lon="8.89266667"><ele>2372</ele>${time3}</trkpt>
	  <trkpt lat="46.57650000" lon="8.89280556"><ele>2373</ele>${time4}</trkpt>
    <trkpt lat="46.57638889" lon="8.89302778"><ele>2374</ele>${time5}</trkpt>
  </trkseg></trk>
</gpx>`.trim();
};

describe("evenly distributed timestamps", () => {
  const gpxOneTrackPointWithTimestamp = createGpxWithOneTrackPoint(
    `<time>${new Date(startExampleTime).toISOString()}</time>`,
  );

  test("file with only one point", () => {
    assert.deepStrictEqual(
      createTimestampsEvenly(
        createGpxWithOneTrackPoint(),
        startExampleTime,
        endExampleTime,
      ),
      gpxOneTrackPointWithTimestamp,
    );
  });

  test("file with five track points", () => {
    const timeStamps = getUniformDistribution(
      5,
      startExampleTime,
      endExampleTime,
    );
    const gpxFiveTrackPointsWithTimestamp = createGpxWithFiveTrackPoints(
      `<time>${new Date(timeStamps[0]).toISOString()}</time>`,
      `<time>${new Date(timeStamps[1]).toISOString()}</time>`,
      `<time>${new Date(timeStamps[2]).toISOString()}</time>`,
      `<time>${new Date(timeStamps[3]).toISOString()}</time>`,
      `<time>${new Date(timeStamps[4]).toISOString()}</time>`,
    );

    assert.deepStrictEqual(
      createTimestampsEvenly(
        createGpxWithFiveTrackPoints(),
        startExampleTime,
        endExampleTime,
      ),
      gpxFiveTrackPointsWithTimestamp,
    );
  });
});

describe("helper function for creating distributed timestamps", () => {
  test("it returns correct for zero timestamps", () => {
    assert.strictEqual(getUniformDistribution(0, 10, 110).length, 0);
  });
  test("it returns correct for one timestamp", () => {
    assert.deepStrictEqual(getUniformDistribution(1, 10, 11), [10]);
  });

  test("that it returns correct for start and end when multiple timestamps", () => {
    const count = 5;
    const startTime = 20;
    const endTime = 100;
    const timestamps = getUniformDistribution(count, startTime, endTime);
    assert.strictEqual(timestamps.length, count);
    assert.deepStrictEqual(timestamps[0], startTime);
    assert.deepStrictEqual(timestamps[timestamps.length - 1], endTime);
  });

  test("it returns correct for multiple timestamps", () => {
    const count = 5;
    assert.deepStrictEqual(getUniformDistribution(count, 20, 100), [
      20,
      40,
      60,
      80,
      100,
    ]);  });
});
