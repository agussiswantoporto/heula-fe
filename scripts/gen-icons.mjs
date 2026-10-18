/**
 * Brand icon generator (design 12.4).
 *
 * Produces four valid PNGs with no external image deps (uses Node's built-in
 * zlib for the IDAT deflate): a plain emerald rounded square with a white "H",
 * no emoji, no decorative art. Run with `node scripts/gen-icons.mjs`.
 *
 * Outputs:
 *   public/icons/icon-192.png        192x192  full-bleed rounded square
 *   public/icons/icon-512.png        512x512  full-bleed rounded square
 *   public/icons/maskable-512.png    512x512  with safe padding (smaller square)
 *   public/icons/apple-touch-icon.png 180x180 full-bleed rounded square
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "icons");

// Brand palette (sRGB).
const BRAND = [0x0e, 0x9f, 0x6e]; // #0e9f6e
const WHITE = [0xff, 0xff, 0xff];
const BG = [0xf7, 0xf8, 0xf8]; // light surface behind the maskable padding

/** CRC32 for PNG chunks. */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

/** Encode an RGBA pixel buffer (size*size*4) into a PNG Buffer. */
function encodePng(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Prepend filter byte (0 = none) to each scanline.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Set a pixel (with simple src-over alpha against existing content). */
function setPx(rgba, size, x, y, rgb, a = 255) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  const inv = (255 - a) / 255;
  rgba[i] = Math.round(rgb[0] * (a / 255) + rgba[i] * inv);
  rgba[i + 1] = Math.round(rgb[1] * (a / 255) + rgba[i + 1] * inv);
  rgba[i + 2] = Math.round(rgb[2] * (a / 255) + rgba[i + 2] * inv);
  rgba[i + 3] = Math.max(rgba[i + 3], a);
}

function fillRect(rgba, size, x0, y0, x1, y1, rgb, a = 255) {
  for (let y = Math.round(y0); y < Math.round(y1); y++) {
    for (let x = Math.round(x0); x < Math.round(x1); x++) {
      setPx(rgba, size, x, y, rgb, a);
    }
  }
}

/**
 * Draw a filled rounded square centered in the canvas.
 * squareFrac controls the square size relative to canvas (1 = full bleed).
 */
function drawIcon(size, squareFrac) {
  const rgba = Buffer.alloc(size * size * 4);
  // Transparent base; for maskable we paint a solid bg so padding is not transparent.
  const padded = squareFrac < 1;
  if (padded) {
    for (let i = 0; i < size * size; i++) {
      rgba[i * 4] = BG[0];
      rgba[i * 4 + 1] = BG[1];
      rgba[i * 4 + 2] = BG[2];
      rgba[i * 4 + 3] = 255;
    }
  }

  const sq = size * squareFrac;
  const left = (size - sq) / 2;
  const top = (size - sq) / 2;
  const radius = sq * 0.22;

  // Rounded square: fill with corner rounding via distance test.
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const lx = x - left;
      const ly = y - top;
      if (lx < 0 || ly < 0 || lx >= sq || ly >= sq) continue;
      // Determine nearest corner center for rounding.
      let inside = true;
      const cxs = [radius, sq - radius];
      const cys = [radius, sq - radius];
      // Corner regions
      if (lx < radius || lx > sq - radius) {
        if (ly < radius || ly > sq - radius) {
          const cx = lx < radius ? cxs[0] : cxs[1];
          const cy = ly < radius ? cys[0] : cys[1];
          const dx = lx - cx;
          const dy = ly - cy;
          inside = dx * dx + dy * dy <= radius * radius;
        }
      }
      if (inside) setPx(rgba, size, x, y, BRAND, 255);
    }
  }

  // White "H": two vertical bars + a crossbar, centered in the square.
  const glyphH = sq * 0.46;
  const glyphW = sq * 0.42;
  const gx = left + (sq - glyphW) / 2;
  const gy = top + (sq - glyphH) / 2;
  const bar = sq * 0.1; // stroke width
  // Left bar
  fillRect(rgba, size, gx, gy, gx + bar, gy + glyphH, WHITE);
  // Right bar
  fillRect(rgba, size, gx + glyphW - bar, gy, gx + glyphW, gy + glyphH, WHITE);
  // Crossbar
  const crossY0 = gy + (glyphH - bar) / 2;
  fillRect(rgba, size, gx, crossY0, gx + glyphW, crossY0 + bar, WHITE);

  return encodePng(size, rgba);
}

mkdirSync(OUT_DIR, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192, frac: 1 },
  { file: "icon-512.png", size: 512, frac: 1 },
  { file: "maskable-512.png", size: 512, frac: 0.72 }, // safe padding for maskable
  { file: "apple-touch-icon.png", size: 180, frac: 1 },
];

for (const t of targets) {
  const png = drawIcon(t.size, t.frac);
  writeFileSync(join(OUT_DIR, t.file), png);
  console.log(`wrote public/icons/${t.file} (${png.length} bytes)`);
}
