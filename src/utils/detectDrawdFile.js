import { FILE_EXTENSION, LEGACY_FILE_EXTENSION } from "../constants";

/**
 * Find the first .drawd (or legacy .flowforge) file in a FileList / File array.
 * Returns the File object, or null if none found.
 */
export function detectDrawdFile(files) {
  for (const f of files) {
    if (f.name.endsWith(FILE_EXTENSION) || f.name.endsWith(LEGACY_FILE_EXTENSION)) {
      return f;
    }
  }
  return null;
}

/**
 * Find the first .drawd (or legacy .flowforge) DataTransferItem in a DataTransferItemList.
 * Returns the DataTransferItem, or null if none found.
 * Used to obtain a FileSystemFileHandle via item.getAsFileSystemHandle().
 */
export function findDrawdItem(items) {
  for (const item of items) {
    if (item.kind !== "file") continue;
    const f = item.getAsFile();
    if (f && (f.name.endsWith(FILE_EXTENSION) || f.name.endsWith(LEGACY_FILE_EXTENSION))) {
      return item;
    }
  }
  return null;
}
