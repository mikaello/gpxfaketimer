import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  createTimestampsEvenly,
  createTimestampsFromSpeed,
  getSpeedBasedTimestamps,
  getUniformDistribution,
  haversineDistanceMeters,
} from "../src/index.ts";

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

const multiSegmentGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.1">
  <trk><trkseg>
    <trkpt lat="0" lon="0"><ele>1</ele><time>2000-01-01T00:00:00.000Z</time><extensions><note>keep</note></extensions></trkpt>
    <trkpt lat="0" lon="0.001"/>
  </trkseg></trk>
  <trk><trkseg><trkpt lat="50" lon="50"/></trkseg></trk>
</gpx>`;

const readTrackTimes = (gpx: string) => {
  const doc = new DOMParser().parseFromString(gpx, "text/xml");
  return Array.from(doc.getElementsByTagName("trkpt"), (point) =>
    Array.from(point.childNodes)
      .filter(
        (node): node is Element =>
          node.nodeType === 1 && node.localName === "time",
      )
      .map((node) => node.textContent),
  );
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

  test("timestamps every track and segment and replaces existing times", () => {
    const result = createTimestampsEvenly(multiSegmentGpx, 0, 2000);
    assert.deepStrictEqual(readTrackTimes(result), [
      ["1970-01-01T00:00:00.000Z"],
      ["1970-01-01T00:00:01.000Z"],
      ["1970-01-01T00:00:02.000Z"],
    ]);
    assert.deepStrictEqual(
      readTrackTimes(createTimestampsEvenly(result, 0, 2000)),
      readTrackTimes(result),
    );
    assert.match(result, /<ele>1<\/ele><time>[^<]+<\/time><extensions>/);
  });

  test("uses UTF-8 when the input has no XML declaration", () => {
    const result = createTimestampsEvenly(
      '<gpx><trk><trkseg><trkpt lat="0" lon="0"/></trkseg></trk></gpx>',
      0,
      0,
    );
    assert.match(result, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  });

  test("preserves a GPX namespace prefix on new time elements", () => {
    const input =
      '<g:gpx xmlns:g="http://www.topografix.com/GPX/1/1"><g:trk><g:trkseg><g:trkpt lat="0" lon="0"/></g:trkseg></g:trk></g:gpx>';
    const result = createTimestampsEvenly(input, 0, 0);
    assert.match(
      result,
      /<g:trkpt[^>]*><g:time>1970-01-01T00:00:00.000Z<\/g:time><\/g:trkpt>/,
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
    ]);
  });

  test("rejects a reversed time interval", () => {
    assert.throws(() => getUniformDistribution(2, 100, 0), RangeError);
  });
});

describe("haversineDistanceMeters", () => {
  test("returns 0 for identical points", () => {
    assert.strictEqual(haversineDistanceMeters(10, 20, 10, 20), 0);
  });

  test("returns approximate distance between two known points", () => {
    // Approx 1 degree of latitude ~ 111km
    const dist = haversineDistanceMeters(0, 0, 1, 0);
    assert.ok(dist > 110000 && dist < 112000, `Expected ~111km, got ${dist}`);
  });
});

describe("getSpeedBasedTimestamps", () => {
  test("single point returns only start time", () => {
    assert.deepStrictEqual(getSpeedBasedTimestamps([], 1000, 10), [1000]);
  });

  test("rejects invalid speed", () => {
    assert.throws(() => getSpeedBasedTimestamps([100], 0, 0), RangeError);
    assert.throws(() => getSpeedBasedTimestamps([100], 0, Infinity), RangeError);
  });

  test("calculates correct timestamps for known distance and speed in kmh", () => {
    // 36 km/h = 10 m/s; 100 m takes 10 s = 10000 ms
    const timestamps = getSpeedBasedTimestamps([100], 0, 36, "kmh");
    assert.strictEqual(timestamps.length, 2);
    assert.strictEqual(timestamps[0], 0);
    assert.ok(Math.abs(timestamps[1] - 10000) < 1, `Expected 10000ms, got ${timestamps[1]}`);
  });

  test("calculates correct timestamps for known distance and speed in mph", () => {
    // 1 mph = 0.44704 m/s; 44.704 m takes 100 s = 100000 ms
    const timestamps = getSpeedBasedTimestamps([44.704], 0, 1, "mph");
    assert.strictEqual(timestamps.length, 2);
    assert.ok(Math.abs(timestamps[1] - 100000) < 1, `Expected 100000ms, got ${timestamps[1]}`);
  });

  test("timestamps are monotonically increasing", () => {
    const distances = [10, 20, 15, 30];
    const timestamps = getSpeedBasedTimestamps(distances, 1000, 10, "kmh");
    assert.strictEqual(timestamps.length, 5);
    for (let i = 1; i < timestamps.length; i++) {
      assert.ok(timestamps[i] > timestamps[i - 1]);
    }
  });
});

describe("speed-based timestamps in GPX", () => {
  test("single point gets start time", () => {
    const result = createTimestampsFromSpeed(
      createGpxWithOneTrackPoint(),
      startExampleTime,
      10,
    );
    assert.ok(result.includes(new Date(startExampleTime).toISOString()));
  });

  test("five points get increasing timestamps", () => {
    const result = createTimestampsFromSpeed(
      createGpxWithFiveTrackPoints(),
      startExampleTime,
      10,
    );
    const times = [...result.matchAll(/<time>([^<]+)<\/time>/g)].map(
      (m) => new Date(m[1]).getTime(),
    );
    assert.strictEqual(times.length, 5);
    assert.strictEqual(times[0], startExampleTime);
    for (let i = 1; i < times.length; i++) {
      assert.ok(times[i] > times[i - 1]);
    }
  });

  test("higher speed produces shorter total duration", () => {
    const slow = createTimestampsFromSpeed(
      createGpxWithFiveTrackPoints(),
      startExampleTime,
      5,
    );
    const fast = createTimestampsFromSpeed(
      createGpxWithFiveTrackPoints(),
      startExampleTime,
      20,
    );
    const lastTimeSlow = new Date(
      [...slow.matchAll(/<time>([^<]+)<\/time>/g)].at(-1)![1],
    ).getTime();
    const lastTimeFast = new Date(
      [...fast.matchAll(/<time>([^<]+)<\/time>/g)].at(-1)![1],
    ).getTime();
    assert.ok(lastTimeFast < lastTimeSlow);
  });

  test("mph and kmh produce different durations for same numeric speed", () => {
    const kmh = createTimestampsFromSpeed(
      createGpxWithFiveTrackPoints(),
      startExampleTime,
      10,
      "kmh",
    );
    const mph = createTimestampsFromSpeed(
      createGpxWithFiveTrackPoints(),
      startExampleTime,
      10,
      "mph",
    );
    const lastKmh = new Date(
      [...kmh.matchAll(/<time>([^<]+)<\/time>/g)].at(-1)![1],
    ).getTime();
    const lastMph = new Date(
      [...mph.matchAll(/<time>([^<]+)<\/time>/g)].at(-1)![1],
    ).getTime();
    // 10 mph > 10 km/h, so mph should finish sooner
    assert.ok(lastMph < lastKmh);
  });

  test("timestamps later segments without inventing travel across gaps", () => {
    const result = createTimestampsFromSpeed(multiSegmentGpx, 0, 36);
    const times = readTrackTimes(result).map(([time]) =>
      new Date(time!).getTime(),
    );
    assert.strictEqual(times.length, 3);
    assert.strictEqual(times[0], 0);
    assert.ok(times[1] > times[0]);
    assert.strictEqual(times[2], times[1]);
    assert.deepStrictEqual(
      readTrackTimes(createTimestampsFromSpeed(result, 0, 36)),
      readTrackTimes(result),
    );
  });
});
