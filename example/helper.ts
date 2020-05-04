import { createTimestampsEvenly } from "@mikaello/gpxfaketimer";
import { time } from "console";

declare global {
  interface Window {
    generateTimestamps: () => void;
  }
}

export const generateTimestamps = () => {
  const timestampButton = document.getElementById("generate-timestamps-btn");

  timestampButton.onclick = () => {
    const gpx = document.getElementById("gpx-no-timestamp").innerText;

    const now = new Date().valueOf();
    console.log("gpx", gpx);
    const timeGpx = createTimestampsEvenly(gpx, now, now + 60 * 60 * 1000);

    console.log("timegpx", timeGpx);

    const gpxPaste = document.getElementById("gpx-with-timestamp");
    gpxPaste.innerText = timeGpx;
    gpxPaste.style.visibility = "visible";
  };
};

window.generateTimestamps = generateTimestamps;
