# GPX fake timer

Create timestamps for every trackpoint in a GPX file.

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

## Utility functions

Not specific for GPX, but just as helper functions

_`getUniformDistribution(count: number, intervalStart: number, intervalEnd: number) => number[]`_:
returns an array of length `count` with first element `intervalStart` and last
element `intervalEnd`, all elements in between is evenly distributed between
these extremeties.

## Develop

You can use the [./example](./example) project to ease developing. If you run
`yarn start` from that folder, you will start a server running a small
application which loads the code from this module. Run `yarn dev` in another
terminal to start to continously watch the code and recompile (and reload
server) when any code changes.

Contributions are welcome :-)
