import { createTimestampsEvenly } from "@mikaello/gpxfaketimer";

declare global {
  interface Window {
    generateTimestamps: () => void;
  }
}

export const setDefaultDateTime = (elementId: string, date?: Date) => {
  const now = date ? date : new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const datetime = (<HTMLInputElement> document.getElementById(elementId));

  datetime.value = now
    .toJSON()
    .substring(0, 16);
};

export const generateTimestamps = () => {
  const timestampButton = document.getElementById("generate-timestamps-btn");

  timestampButton.onclick = () => {
    const gpx = (<HTMLTextAreaElement> (
      document.getElementById("gpx-no-timestamp")
    )).value;

    const timeStart =
      (<HTMLInputElement> document.getElementById("timestamp-start"));
    const now = timeStart?.value
      ? new Date(timeStart.value).valueOf()
      : new Date().valueOf();

    const gpxPaste = <HTMLTextAreaElement> (
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
