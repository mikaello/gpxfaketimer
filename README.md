# GPX fake timer

Create timestamps for every trackpoint in a GPX file.

## Example

```ts
import { createTimestampsEvenly } from "@mikaello/gpxfaketimer";

const exampleGpx = `
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.0">
    <name>Example gpx</name>
    <trk>
        <name>Example gpx</name>
        <number>1</number>
        <trkseg>
            <trkpt lat="46.57608333" lon="8.89241667"><ele>2376</ele></trkpt>
            <trkpt lat="46.57619444" lon="8.89252778"><ele>2375</ele></trkpt>
            <trkpt lat="46.57661111" lon="8.89344444"><ele>2376</ele></trkpt>
        </trkseg>
    </trk>
</gpx>
`;

console.log(createTimestampsEvenly(exampleGpx, 0, 100000));
// => will return the same GPX file, only with <time>int</time> inside every trkpt.
```

## API

- _`createTimestampsEvenly(gpxContent: string, startTime: number, endTime: number) => string`_:
  returns the incomming `gpxContent` enriched with timestamps in every `trkpt`.
  `startTime` and `endTime` is milliseconds since epoch.

## Utility functions

Not specific for GPX, but just as helper functions

_`getUniformDistribution(count: number, intervalStart: number, intervalEnd: number) => number[]`_:
returns an array of length `count` with first element `intervalStart` and last
element `intervalEnd`, all elements in between is evenly distributed between
these extremeties.

## Develop

You can use the [example](./example) project to ease developing. If you go into
that and run `yarn start`, you will start a server running a small application
wich loads the code from this module. Run `yarn dev` in another tab to start to
continously watch the code and recompile (and reload server) when any code
changes.

Contributions are welcome :-)
