# GPX fake timer

[![npm](https://img.shields.io/npm/v/@mikaello/gpxfaketimer.svg?style=flat-square)](https://www.npmjs.com/package/@mikaello/gpxfaketimer)

Create timestamps for every trackpoint in a GPX file.

```shell
npm install @mikaello/gpxfaketimer
```

## Example

```ts
import { createTimestampsEvenly } from "@mikaello/gpxfaketimer";

const exampleGpx = `
<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.0">
  <name>Example gpx</name>
  <trk>
    <name>Example gpx</name>
    <number>1</number>
    <trkseg>
      <trkpt lat="46.57608333" lon="8.89241667">
        <ele>2376</ele>
      </trkpt>
      <trkpt lat="46.57619444" lon="8.89252778">
        <ele>2375</ele>
      </trkpt>
      <trkpt lat="46.57661111" lon="8.89344444">
        <ele>2376</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>
`;

console.log(createTimestampsEvenly(exampleGpx, 0, 100000));
// => will return the same GPX file, only with <time>date here</time> inside every trkpt:

/*
<?xml version="1.0" encoding="UTF-8"?>
<gpx xmlns="http://www.topografix.com/GPX/1/1" version="1.0">
  <name>Example gpx</name>
  <trk>
    <name>Example gpx</name>
    <number>1</number>
    <trkseg>
      <trkpt lat="46.57608333" lon="8.89241667">
        <ele>2376</ele>
        <time>1970-01-01T00:00:00.000Z</time>
      </trkpt>
      <trkpt lat="46.57619444" lon="8.89252778">
        <ele>2375</ele>
        <time>1970-01-01T00:00:50.000Z</time>
      </trkpt>
      <trkpt lat="46.57661111" lon="8.89344444">
        <ele>2376</ele>
        <time>1970-01-01T00:01:40.000Z</time>
      </trkpt>
    </trkseg>
  </trk>
</gpx>
*/
```

## API

- _`createTimestampsEvenly(gpxContent: string, startTime: number, endTime: number) => string`_:
  returns the incoming `gpxContent` enriched with timestamps in every `trkpt`
  element. `startTime` and `endTime` are milliseconds since epoch.

- _`createTimestampsFromSpeed(gpxContent: string, startTime: number, speed: number, unit?: "kmh" | "mph") => string`_:
  returns the incoming `gpxContent` enriched with timestamps calculated from the
  GPS distance between each track point at the given speed.
  `unit` defaults to `"kmh"`.

## CLI

```shell
npx @mikaello/gpxfaketimer input.gpx --output output.gpx
```

Options:

| Flag | Description |
|------|-------------|
| `--output`, `-o` | Output file (default: stdout) |
| `--start` | Start time as ISO 8601 or Unix ms (default: now) |
| `--end` | End time for evenly distributed mode |
| `--speed` | Speed value for distance-based timing |
| `--unit` | Speed unit: `kmh` or `mph` (default: `kmh`, requires `--speed`) |
| `--help`, `-h` | Show help |

When `--speed` is provided, timestamps are calculated from GPS distances at that
speed.
Otherwise, timestamps are evenly distributed between `--start` and `--end`
(default duration: 1 hour).

## Utility functions

Not specific for GPX, but just as helper functions

_`getUniformDistribution(count: number, intervalStart: number, intervalEnd: number) => number[]`_:
returns an array of length `count` with first element `intervalStart` and last
element `intervalEnd`, all elements in between is evenly distributed between
these extremeties.

## Develop

You can use the [./example](./example) project to ease developing. Run
`npm run dev` from that folder to start a Vite dev server that loads the code
from this module with hot module replacement.

Contributions are welcome :-)
