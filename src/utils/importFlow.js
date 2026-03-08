export function importFlow(fileText) {
  let data;
  try {
    data = JSON.parse(fileText);
  } catch {
    throw new Error("Invalid file: not valid JSON.");
  }

  if (typeof data.version !== "number") {
    throw new Error("Invalid file: missing version field.");
  }

  if (data.version > 4) {
    throw new Error(
      `Unsupported file version ${data.version}. Please update FlowForge to open this file.`
    );
  }

  if (!Array.isArray(data.screens)) {
    throw new Error("Invalid file: screens must be an array.");
  }

  if (!Array.isArray(data.connections)) {
    throw new Error("Invalid file: connections must be an array.");
  }

  // Backward compat: default stateGroup/stateName for older files
  for (const screen of data.screens) {
    if (screen.stateGroup === undefined) screen.stateGroup = null;
    if (screen.stateName === undefined) screen.stateName = "";
    if (Array.isArray(screen.hotspots)) {
      for (const hs of screen.hotspots) {
        if (!hs.elementType) hs.elementType = "button";
        if (!hs.apiEndpoint) hs.apiEndpoint = "";
        if (!hs.apiMethod) hs.apiMethod = "";
        if (!hs.customDescription) hs.customDescription = "";
        if (!hs.apiDocs) hs.apiDocs = "";
        if (!hs.onSuccessAction) hs.onSuccessAction = "";
        if (!hs.onSuccessTargetId) hs.onSuccessTargetId = "";
        if (!hs.onSuccessCustomDesc) hs.onSuccessCustomDesc = "";
        if (!hs.onErrorAction) hs.onErrorAction = "";
        if (!hs.onErrorTargetId) hs.onErrorTargetId = "";
        if (!hs.onErrorCustomDesc) hs.onErrorCustomDesc = "";
      }
    }
  }

  // Backward compat: default connectionPath for older files
  for (const conn of data.connections) {
    if (!conn.connectionPath) conn.connectionPath = "default";
  }

  return data;
}
