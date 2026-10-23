import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function crc32(buf) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const checksum = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(checksum, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, r, g, b) {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type RGB
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = makeChunk('IHDR', ihdrData);

  // Scanlines (Filter byte 0 + RGB for each pixel)
  const rowBytes = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowBytes);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 3;
      
      // Determine if pixel is in corner border radius
      const cornerRadius = Math.floor(width * 0.2);
      let inCorner = false;
      if (x < cornerRadius && y < cornerRadius) {
        inCorner = Math.hypot(cornerRadius - x, cornerRadius - y) > cornerRadius;
      } else if (x >= width - cornerRadius && y < cornerRadius) {
        inCorner = Math.hypot(x - (width - cornerRadius), cornerRadius - y) > cornerRadius;
      } else if (x < cornerRadius && y >= height - cornerRadius) {
        inCorner = Math.hypot(cornerRadius - x, y - (height - cornerRadius)) > cornerRadius;
      } else if (x >= width - cornerRadius && y >= height - cornerRadius) {
        inCorner = Math.hypot(x - (width - cornerRadius), y - (height - cornerRadius)) > cornerRadius;
      }

      // Draw stylized 'S' in center
      const cx = x / width;
      const cy = y / height;
      const isS = (
        (cy >= 0.25 && cy <= 0.35 && cx >= 0.3 && cx <= 0.7) || // top bar
        (cy >= 0.35 && cy <= 0.52 && cx >= 0.3 && cx <= 0.45) || // top left
        (cy >= 0.45 && cy <= 0.55 && cx >= 0.3 && cx <= 0.7) || // middle bar
        (cy >= 0.55 && cy <= 0.72 && cx >= 0.55 && cx <= 0.7) || // bottom right
        (cy >= 0.65 && cy <= 0.75 && cx >= 0.3 && cx <= 0.7)    // bottom bar
      );

      if (inCorner) {
        rawData[pxOffset] = 10;
        rawData[pxOffset + 1] = 13;
        rawData[pxOffset + 2] = 20;
      } else if (isS) {
        rawData[pxOffset] = 255;
        rawData[pxOffset + 1] = 255;
        rawData[pxOffset + 2] = 255;
      } else {
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressedData);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, ihdr, idat, iend]);
}

const iconsDir = path.resolve(__dirname, '../public/icons');
fs.mkdirSync(iconsDir, { recursive: true });

// Indigo theme: #6366f1 -> (99, 102, 241)
fs.writeFileSync(path.join(iconsDir, 'icon-16.png'), createPng(16, 16, 99, 102, 241));
fs.writeFileSync(path.join(iconsDir, 'icon-48.png'), createPng(48, 48, 99, 102, 241));
fs.writeFileSync(path.join(iconsDir, 'icon-128.png'), createPng(128, 128, 99, 102, 241));

console.log('Successfully generated icon-16.png, icon-48.png, icon-128.png');
