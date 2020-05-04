import { createTimestampsEvenly } from "@mikaello/gpxfaketimer";

declare global {
  interface Window {
    generateTimestamps: () => void;
  }
}

export const generateTimestamps = () => {
  const timestampButton = document.getElementById("generate-timestamps-btn");

  timestampButton.onclick = () => {
    const gpx = (<HTMLTextAreaElement>(
      document.getElementById("gpx-no-timestamp")
    )).value;

    const now = new Date().valueOf();

    const gpxPaste = <HTMLTextAreaElement>(
      document.getElementById("gpx-with-timestamp")
    );

    try {
      const timeGpx = createTimestampsEvenly(gpx, now, now + 60 * 60 * 1000);
      gpxPaste.value = timeGpx;
    } catch (e) {
      const errorNode = document.createElement("p");
      errorNode.textContent = "ERROR PARSING";
      errorNode.style.fontWeight = "700";
      errorNode.style.color = "red";

      document.insertBefore(errorNode, gpxPaste);
      gpxPaste.value = e;
    }
    gpxPaste.style.visibility = "visible";
  };
};

window.generateTimestamps = generateTimestamps;
