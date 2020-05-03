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

  const track = gpxDoc.documentElement.querySelector("trk");
  const trackSegment = track?.querySelector("trkseg");

  if (trackSegment == null) {
    return gpxContent;
  }

  const trackPoints = trackSegment.querySelectorAll("trkpt");
  const timeStamps = getDistributedTimeStamps(
    trackPoints.length,
    startTime,
    endTime,
  );

  trackPoints.forEach((point, index) => {
    const time = new Date(timeStamps[index]).toISOString();
    point.insertAdjacentHTML("beforeend", `<time>${time}</time>`);
  });

  const serializer = new XMLSerializer();

  return `<?xml version="1.0" encoding="${gpxDoc.inputEncoding}"?>\n` +
    serializer.serializeToString(gpxDoc);
};

export const getDistributedTimeStamps = (
  count: number,
  startTime: number,
  endTime: number,
) => {
  if (endTime < startTime) {
    console.error(
      `end time (${endTime}) is smaller than start time (${startTime})`,
    );
    return [];
  }

  if (count === 0) {
    return [];
  } else if (count === 1) {
    return [startTime];
  }

  const milliSecondDiff = endTime - startTime;

  const timeStep = Math.floor(milliSecondDiff / (count - 1));

  const timeStamps = Array(count)
    .fill(0)
    .map((_, index) => startTime + index * timeStep);

  if (count > 1) {
    // Last time stamp must be end time
    timeStamps[timeStamps.length - 1] = endTime;
  }

  return timeStamps;
};
