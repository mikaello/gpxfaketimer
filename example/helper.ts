import { createTimestampsEvenly, createTimestampsFromSpeed } from "@mikaello/gpxfaketimer";

declare global {
  interface Window {
    generateTimestamps: () => void;
  }
}

let uploadedFileName: string | null = null;

export const setDefaultDateTime = (elementId: string, date?: Date) => {
  const now = date ? date : new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const datetime = (<HTMLInputElement> document.getElementById(elementId));

  datetime.value = now
    .toJSON()
    .substring(0, 19);
};

const loadFileIntoTextarea = (file: File) => {
  if (!file.name.toLowerCase().endsWith(".gpx")) {
    alert("Please upload a .gpx file.");
    return;
  }
  uploadedFileName = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    const textarea = <HTMLTextAreaElement> document.getElementById("gpx-no-timestamp");
    textarea.value = e.target?.result as string;
  };
  reader.readAsText(file);
};

export const setupFileUpload = () => {
  const fileInput = <HTMLInputElement> document.getElementById("gpx-file-input");
  const dropZone = <HTMLElement> document.getElementById("drop-zone");
  const textarea = <HTMLTextAreaElement> document.getElementById("gpx-no-timestamp");

  fileInput.addEventListener("change", () => {
    if (fileInput.files?.[0]) {
      loadFileIntoTextarea(fileInput.files[0]);
    }
  });

  const preventDefaults = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };

  ["dragenter", "dragover"].forEach((event) => {
    dropZone.addEventListener(event, (e) => {
      preventDefaults(e);
      dropZone.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((event) => {
    dropZone.addEventListener(event, (e) => {
      preventDefaults(e);
      dropZone.classList.remove("drag-over");
    });
  });

  dropZone.addEventListener("drop", (e: DragEvent) => {
    const file = e.dataTransfer?.files[0];
    if (file) {
      loadFileIntoTextarea(file);
    }
  });

  // Also support drag-and-drop directly onto the textarea
  textarea.addEventListener("dragover", preventDefaults);
  textarea.addEventListener("drop", (e: DragEvent) => {
    preventDefaults(e);
    const file = e.dataTransfer?.files[0];
    if (file) {
      loadFileIntoTextarea(file);
    }
  });
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

    const mode = (<HTMLInputElement> document.querySelector('input[name="timing-mode"]:checked'))?.value ?? "evenly";

    try {
      let timeGpx: string;
      if (mode === "speed") {
        const speed = parseFloat(
          (<HTMLInputElement> document.getElementById("speed-value")).value,
        ) || 10;
        const unit = (<HTMLSelectElement> document.getElementById("speed-unit")).value as "kmh" | "mph";
        timeGpx = createTimestampsFromSpeed(gpx, now, speed, unit);
      } else {
        timeGpx = createTimestampsEvenly(gpx, now, now + 60 * 60 * 1000);
      }
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

export const setupDownload = () => {
  const downloadButton = document.getElementById("download-btn");
  if (!downloadButton) return;

  downloadButton.onclick = () => {
    const gpxPaste = <HTMLTextAreaElement> document.getElementById("gpx-with-timestamp");
    const content = gpxPaste.value;
    if (!content) {
      return;
    }

    const baseName = uploadedFileName
      ? uploadedFileName.replace(/\.gpx$/i, "")
      : "output";
    const filename = `${baseName}-with-timestamps.gpx`;

    const blob = new Blob([content], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };
};

window.generateTimestamps = generateTimestamps;
