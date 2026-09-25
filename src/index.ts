export type SpeedUnit = "kmh" | "mph";

const getTrackSegments = (gpxDoc: Document): Element[] =>
  Array.from(gpxDoc.documentElement.getElementsByTagNameNS("*", "trk")).flatMap(
    (track) => Array.from(track.getElementsByTagNameNS("*", "trkseg")),
  );

const getTrackPoints = (gpxDoc: Document): Element[] =>
  getTrackSegments(gpxDoc).flatMap((segment) =>
    Array.from(segment.getElementsByTagNameNS("*", "trkpt")),
  );

const setPointTime = (gpxDoc: Document, point: Element, timestamp: number) => {
  const children = Array.from(point.childNodes).filter(
    (node): node is Element => node.nodeType === 1,
  );
  const existingTime = children.find(
    (child) =>
      child.localName === "time" && child.namespaceURI === point.namespaceURI,
  );
  if (existingTime) {
    existingTime.textContent = new Date(timestamp).toISOString();
    return;
  }

  const qualifiedName = point.prefix ? `${point.prefix}:time` : "time";
  const timeEl = gpxDoc.createElementNS(point.namespaceURI, qualifiedName);
  timeEl.textContent = new Date(timestamp).toISOString();
  const firstAfterElevation = children.find(
    (child) => child.localName !== "ele",
  );
  point.insertBefore(timeEl, firstAfterElevation ?? null);
};

const serializeGpx = (gpxDoc: Document): string => {
  const formattedGpx = new XMLSerializer().serializeToString(gpxDoc);
  if (formattedGpx.startsWith("<?xml")) {
    return formattedGpx;
  }
  return (
    `<?xml version="1.0" encoding="${gpxDoc.inputEncoding ?? "UTF-8"}"?>\n` +
    formattedGpx
  );
};

/**
 * Calculate the distance in meters between two GPS coordinates using the Haversine formula.
 */
export const haversineDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calculate timestamps for each point given the distances (in meters) between
 * consecutive points, a start time, and a speed.
 *
 * @param distances distances in meters between consecutive track points (length = points - 1)
 * @param startTime start time in milliseconds since epoch
 * @param speed speed value
 * @param unit speed unit, "kmh" or "mph" (default: "kmh")
 */
export const getSpeedBasedTimestamps = (
  distances: number[],
  startTime: number,
  speed: number,
  unit: SpeedUnit = "kmh",
): number[] => {
  if (!Number.isFinite(speed) || speed <= 0) {
    throw new RangeError("speed must be a positive finite number");
  }
  const speedMs = unit === "mph" ? speed * 0.44704 : speed / 3.6;
  const timestamps = [startTime];
  for (const distance of distances) {
    const elapsed = (distance / speedMs) * 1000;
    timestamps.push(timestamps[timestamps.length - 1] + elapsed);
  }
  return timestamps;
};

/**
 * Annotate every track point in a GPX track with timestamps based on distance
 * between points and a configurable speed.
 *
 * @param gpxContent GPX content (XML string)
 * @param startTime start of GPX track (milliseconds since epoch)
 * @param speed speed value
 * @param unit speed unit, "kmh" or "mph" (default: "kmh")
 */
export const createTimestampsFromSpeed = (
  gpxContent: string,
  startTime: number,
  speed: number,
  unit: SpeedUnit = "kmh",
): string => {
  const parser = new DOMParser();
  const gpxDoc = parser.parseFromString(gpxContent, "text/xml");

  if (gpxDoc.documentElement.nodeName === "parsererror") {
    throw new Error("Could not parse GPX content");
  }

  const segments = getTrackSegments(gpxDoc);
  if (segments.length === 0) {
    return gpxContent;
  }

  const points: Element[] = [];
  const distances: number[] = [];
  for (const segment of segments) {
    const segmentPoints = Array.from(
      segment.getElementsByTagNameNS("*", "trkpt"),
    );
    for (const point of segmentPoints) {
      if (points.length > 0) {
        const prev = points[points.length - 1];
        if (point === segmentPoints[0]) {
          // A segment break does not describe a travelled path.
          distances.push(0);
        } else {
          const lat1 = parseFloat(prev.getAttribute("lat") ?? "0");
          const lon1 = parseFloat(prev.getAttribute("lon") ?? "0");
          const lat2 = parseFloat(point.getAttribute("lat") ?? "0");
          const lon2 = parseFloat(point.getAttribute("lon") ?? "0");
          distances.push(haversineDistanceMeters(lat1, lon1, lat2, lon2));
        }
      }
      points.push(point);
    }
  }

  const timeStamps = getSpeedBasedTimestamps(distances, startTime, speed, unit);

  points.forEach((point, index) =>
    setPointTime(gpxDoc, point, timeStamps[index]),
  );

  return serializeGpx(gpxDoc);
};

/**
 * Annotate every track point in a GPX track with evenly distributed timestamps.
 * @param gpxContent GPX content (XML string)
 * @param startTime start of GPX track (milliseconds since epoch)
 * @param endTime end of GPX track (milliseconds since epoch)
 */
export const createTimestampsEvenly = (
  gpxContent: string,
  startTime: number,
  endTime: number,
) => {
  const parser = new DOMParser();
  const gpxDoc = parser.parseFromString(gpxContent, "text/xml");

  if (gpxDoc.documentElement.nodeName === "parsererror") {
    throw new Error("Could not parse GPX content");
  }

  const trackPoints = getTrackPoints(gpxDoc);
  if (trackPoints.length === 0) {
    return gpxContent;
  }

  const timeStamps = getUniformDistribution(
    trackPoints.length,
    startTime,
    endTime,
  );

  trackPoints.forEach((point, index) =>
    setPointTime(gpxDoc, point, timeStamps[index]),
  );

  return serializeGpx(gpxDoc);
};

/**
 * Get an array of size `count` with evenly distributed numbers
 * from `start` to `end` (both inclusive).
 *
 * @param count number of steps
 * @param intervalStart start of interval
 * @param intervalEnd end of interval
 */
export const getUniformDistribution = (
  count: number,
  intervalStart: number,
  intervalEnd: number,
) => {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError("count must be a non-negative integer");
  }
  if (!Number.isFinite(intervalStart) || !Number.isFinite(intervalEnd)) {
    throw new RangeError("start and end times must be finite numbers");
  }
  if (intervalEnd < intervalStart) {
    throw new RangeError(
      `end time (${intervalEnd}) is smaller than start time (${intervalStart})`,
    );
  }

  if (count === 0) {
    return [];
  } else if (count === 1) {
    return [intervalStart];
  }

  const milliSecondDiff = intervalEnd - intervalStart;

  const timeStep = Math.floor(milliSecondDiff / (count - 1));

  const timeStamps = Array(count)
    .fill(0)
    .map((_, index) => intervalStart + index * timeStep);

  if (count > 1) {
    // Last time stamp must be end time
    timeStamps[timeStamps.length - 1] = intervalEnd;
  }

  return timeStamps;
};
