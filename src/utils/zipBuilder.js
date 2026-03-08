/**
 * Minimal browser-native ZIP file creator (STORE compression only).
 * Zero dependencies — works with bare ESM imports, no build system required.
 */

// --- CRC-32 (table-based) ---

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// --- Helpers ---

const encoder = new TextEncoder();

function toBytes(content) {
  if (content instanceof Uint8Array) return content;
  return encoder.encode(content);
}

/** Write a 16-bit unsigned little-endian value into a DataView. */
function writeU16(view, offset, value) {
  view.setUint16(offset, value, true);
}

/** Write a 32-bit unsigned little-endian value into a DataView. */
function writeU32(view, offset, value) {
  view.setUint32(offset, value, true);
}

// DOS date/time for "now"
function dosDateTime() {
  const d = new Date();
  const time =
    (d.getSeconds() >> 1) |
    (d.getMinutes() << 5) |
    (d.getHours() << 11);
  const date =
    d.getDate() |
    ((d.getMonth() + 1) << 5) |
    ((d.getFullYear() - 1980) << 9);
  return { time, date };
}

// --- ZIP builder ---

/**
 * Build a ZIP file blob from an array of file entries.
 * @param {Array<{ name: string, content: string | Uint8Array }>} files
 * @returns {Blob} ZIP file as a Blob with type application/zip
 */
export function buildZip(files) {
  const { time, date } = dosDateTime();
  const entries = files.map((f) => {
    const nameBytes = encoder.encode(f.name);
    const data = toBytes(f.content);
    const crc = crc32(data);
    return { nameBytes, data, crc };
  });

  // Calculate total size to pre-allocate buffer
  let totalSize = 0;
  const localOffsets = [];

  for (const entry of entries) {
    localOffsets.push(totalSize);
    // Local file header: 30 bytes + filename + data
    totalSize += 30 + entry.nameBytes.length + entry.data.length;
  }

  const centralDirOffset = totalSize;

  for (const entry of entries) {
    // Central directory header: 46 bytes + filename
    totalSize += 46 + entry.nameBytes.length;
  }

  const centralDirSize = totalSize - centralDirOffset;

  // End of central directory: 22 bytes
  totalSize += 22;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let offset = 0;

  // Write local file headers + data
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Local file header signature
    writeU32(view, offset, 0x04034b50);
    // Version needed to extract (2.0)
    writeU16(view, offset + 4, 20);
    // General purpose bit flag
    writeU16(view, offset + 6, 0);
    // Compression method (0 = stored)
    writeU16(view, offset + 8, 0);
    // Last mod file time
    writeU16(view, offset + 10, time);
    // Last mod file date
    writeU16(view, offset + 12, date);
    // CRC-32
    writeU32(view, offset + 14, entry.crc);
    // Compressed size
    writeU32(view, offset + 18, entry.data.length);
    // Uncompressed size
    writeU32(view, offset + 22, entry.data.length);
    // Filename length
    writeU16(view, offset + 26, entry.nameBytes.length);
    // Extra field length
    writeU16(view, offset + 28, 0);

    offset += 30;

    // Filename
    bytes.set(entry.nameBytes, offset);
    offset += entry.nameBytes.length;

    // File data
    bytes.set(entry.data, offset);
    offset += entry.data.length;
  }

  // Write central directory headers
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Central directory file header signature
    writeU32(view, offset, 0x02014b50);
    // Version made by (2.0)
    writeU16(view, offset + 4, 20);
    // Version needed to extract (2.0)
    writeU16(view, offset + 6, 20);
    // General purpose bit flag
    writeU16(view, offset + 8, 0);
    // Compression method (0 = stored)
    writeU16(view, offset + 10, 0);
    // Last mod file time
    writeU16(view, offset + 12, time);
    // Last mod file date
    writeU16(view, offset + 14, date);
    // CRC-32
    writeU32(view, offset + 16, entry.crc);
    // Compressed size
    writeU32(view, offset + 20, entry.data.length);
    // Uncompressed size
    writeU32(view, offset + 24, entry.data.length);
    // Filename length
    writeU16(view, offset + 28, entry.nameBytes.length);
    // Extra field length
    writeU16(view, offset + 30, 0);
    // File comment length
    writeU16(view, offset + 32, 0);
    // Disk number start
    writeU16(view, offset + 34, 0);
    // Internal file attributes
    writeU16(view, offset + 36, 0);
    // External file attributes
    writeU32(view, offset + 38, 0);
    // Relative offset of local header
    writeU32(view, offset + 42, localOffsets[i]);

    offset += 46;

    // Filename
    bytes.set(entry.nameBytes, offset);
    offset += entry.nameBytes.length;
  }

  // End of central directory record
  // Signature
  writeU32(view, offset, 0x06054b50);
  // Number of this disk
  writeU16(view, offset + 4, 0);
  // Disk where central directory starts
  writeU16(view, offset + 6, 0);
  // Number of central directory records on this disk
  writeU16(view, offset + 8, entries.length);
  // Total number of central directory records
  writeU16(view, offset + 10, entries.length);
  // Size of central directory
  writeU32(view, offset + 12, centralDirSize);
  // Offset of start of central directory
  writeU32(view, offset + 16, centralDirOffset);
  // Comment length
  writeU16(view, offset + 20, 0);

  return new Blob([buffer], { type: "application/zip" });
}

/**
 * Trigger a browser download for a Blob.
 * @param {Blob} blob - The file blob to download
 * @param {string} filename - The suggested filename
 */
export function downloadZip(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
