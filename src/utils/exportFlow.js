import { buildPayload } from "./buildPayload";

export function exportFlow(screens, connections, pan, zoom) {
  const payload = buildPayload(screens, connections, pan, zoom);

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const timestamp = Date.now();
  const a = document.createElement("a");
  a.href = url;
  a.download = `flow-export-${timestamp}.flowforge`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
