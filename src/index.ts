export type SpeedUnit = "kmh" | "mph";

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

  const track = gpxDoc.documentElement.getElementsByTagName("trk").item(0);
  const trackSegment =
    track?.getElementsByTagName("trkseg").item(0) ?? null;

  if (trackSegment == null) {
    return gpxContent;
  }

  const trackPoints = trackSegment.getElementsByTagName("trkpt");
  const points = Array.from(trackPoints);

  const distances: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const lat1 = parseFloat(prev.getAttribute("lat") ?? "0");
    const lon1 = parseFloat(prev.getAttribute("lon") ?? "0");
    const lat2 = parseFloat(curr.getAttribute("lat") ?? "0");
    const lon2 = parseFloat(curr.getAttribute("lon") ?? "0");
    distances.push(haversineDistanceMeters(lat1, lon1, lat2, lon2));
  }

  const timeStamps = getSpeedBasedTimestamps(distances, startTime, speed, unit);

  points.forEach((point, index) => {
    const timeEl = gpxDoc.createElement("time");
    timeEl.textContent = new Date(timeStamps[index]).toISOString();
    point.appendChild(timeEl);
  });

  const serializer = new XMLSerializer();
  const formatedGpx = serializer.serializeToString(gpxDoc);

  if (formatedGpx.startsWith("<?xml")) {
    return formatedGpx;
  } else {
    return (
      `<?xml version="1.0" encoding="${gpxDoc.inputEncoding}"?>\n` +
      serializer.serializeToString(gpxDoc)
    );
  }
};

/**
 * Annotate every track point in an GPX track with (evenly distributed) timestamps.
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

  const track = gpxDoc.documentElement.getElementsByTagName("trk").item(0);
  const trackSegment =
    track?.getElementsByTagName("trkseg").item(0) ?? null;

  if (trackSegment == null) {
    return gpxContent;
  }

  const trackPoints = trackSegment.getElementsByTagName("trkpt");
  const timeStamps = getUniformDistribution(
    trackPoints.length,
    startTime,
    endTime,
  );

  Array.from(trackPoints).forEach((point, index) => {
    const timeEl = gpxDoc.createElement("time");
    timeEl.textContent = new Date(timeStamps[index]).toISOString();
    point.appendChild(timeEl);
  });

  const serializer = new XMLSerializer();
  const formattedGpx = serializer.serializeToString(gpxDoc);

  if (formattedGpx.startsWith("<?xml")) {
    return formattedGpx;
  } else {
    // JSDom handles this differently than browser
    return (
      `<?xml version="1.0" encoding="${gpxDoc.inputEncoding}"?>\n` +
      serializer.serializeToString(gpxDoc)
    );
  }
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
  if (intervalEnd < intervalStart) {
    console.error(
      `end time (${intervalEnd}) is smaller than start time (${intervalStart})`,
    );
    return [];
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
