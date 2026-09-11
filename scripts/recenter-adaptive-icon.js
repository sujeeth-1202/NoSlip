const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

/**
 * Bilinear sampling of a PNG image at floating point coordinates (sx, sy).
 * Uses premultiplied alpha to prevent dark fringing around transparent edges.
 */
function sampleBilinear(src, sx, sy) {
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const fx = sx - x0;
  const fy = sy - y0;

  function getPixel(x, y) {
    if (x < 0 || x >= src.width || y < 0 || y >= src.height) {
      return [0, 0, 0, 0];
    }
    const idx = (y * src.width + x) * 4;
    const a = src.data[idx + 3] / 255;
    return [
      src.data[idx] * a,
      src.data[idx + 1] * a,
      src.data[idx + 2] * a,
      src.data[idx + 3],
    ];
  }

  const p00 = getPixel(x0, y0);
  const p10 = getPixel(x1, y0);
  const p01 = getPixel(x0, y1);
  const p11 = getPixel(x1, y1);

  const w00 = (1 - fx) * (1 - fy);
  const w10 = fx * (1 - fy);
  const w01 = (1 - fx) * fy;
  const w11 = fx * fy;

  const a = p00[3] * w00 + p10[3] * w10 + p01[3] * w01 + p11[3] * w11;
  if (a < 0.5) return [0, 0, 0, 0];

  const rPremult = p00[0] * w00 + p10[0] * w10 + p01[0] * w01 + p11[0] * w11;
  const gPremult = p00[1] * w00 + p10[1] * w10 + p01[1] * w01 + p11[1] * w11;
  const bPremult = p00[2] * w00 + p10[2] * w10 + p01[2] * w01 + p11[2] * w11;

  const alphaFrac = a / 255;
  const r = Math.min(255, Math.max(0, Math.round(rPremult / alphaFrac)));
  const g = Math.min(255, Math.max(0, Math.round(gPremult / alphaFrac)));
  const b = Math.min(255, Math.max(0, Math.round(bPremult / alphaFrac)));

  return [r, g, b, Math.min(255, Math.max(0, Math.round(a)))];
}

/**
 * Finds bounding box of non-transparent pixels.
 */
function getArtworkBounds(png, alphaThreshold = 10) {
  let minX = png.width, maxX = -1, minY = png.height, maxY = -1;

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const a = png.data[(y * png.width + x) * 4 + 3];
      if (a > alphaThreshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const cx = minX + w / 2;
  const cy = minY + h / 2;

  let maxRadius = 0;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const a = png.data[(y * png.width + x) * 4 + 3];
      if (a > alphaThreshold) {
        const dist = Math.hypot(x - cx, y - cy);
        if (dist > maxRadius) maxRadius = dist;
      }
    }
  }

  return { minX, maxX, minY, maxY, w, h, cx, cy, maxRadius };
}

/**
 * Resamples and centers artwork on a target canvas.
 */
function recenterArtwork(srcPng, scale = 1.0, targetWidth = 1024, targetHeight = 1024) {
  const bounds = getArtworkBounds(srcPng);
  const out = new PNG({ width: targetWidth, height: targetHeight });

  const targetCx = targetWidth / 2;
  const targetCy = targetHeight / 2;

  for (let ty = 0; ty < targetHeight; ty++) {
    for (let tx = 0; tx < targetWidth; tx++) {
      // Map target (tx, ty) back to source (sx, sy) centered around bounds.cx, cy
      const sx = bounds.cx + (tx - targetCx) / scale;
      const sy = bounds.cy + (ty - targetCy) / scale;

      const [r, g, b, a] = sampleBilinear(srcPng, sx, sy);
      const outIdx = (ty * targetWidth + tx) * 4;
      out.data[outIdx] = r;
      out.data[outIdx + 1] = g;
      out.data[outIdx + 2] = b;
      out.data[outIdx + 3] = a;
    }
  }

  return { out, bounds };
}

/**
 * Creates a circular preview composited over the Quiet Growth background (#E7DFCE).
 */
function createCirclePreview(foregroundPng, bgColor = [0xE7, 0xDF, 0xCE]) {
  const size = foregroundPng.width;
  const preview = new PNG({ width: size, height: size });

  const cx = size / 2;
  const cy = size / 2;
  // Android Adaptive icon ratio: 72dp mask inside 108dp canvas = 72/108 * size / 2
  const maskRadius = (72 / 108) * (size / 2); // ~341.33 px
  const safeRadius = (66 / 108) * (size / 2); // ~312.88 px

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dist = Math.hypot(x - cx, y - cy);

      const fgR = foregroundPng.data[idx];
      const fgG = foregroundPng.data[idx + 1];
      const fgB = foregroundPng.data[idx + 2];
      const fgA = foregroundPng.data[idx + 3] / 255;

      // Inside circle mask
      if (dist <= maskRadius) {
        let bgR = bgColor[0];
        let bgG = bgColor[1];
        let bgB = bgColor[2];

        // Composite foreground over background
        const r = Math.round(fgR * fgA + bgR * (1 - fgA));
        const g = Math.round(fgG * fgA + bgG * (1 - fgA));
        const b = Math.round(fgB * fgA + bgB * (1 - fgA));

        preview.data[idx] = r;
        preview.data[idx + 1] = g;
        preview.data[idx + 2] = b;
        preview.data[idx + 3] = 255;
      } else {
        // Outside circular mask: outline and dimmed exterior
        const ringDist = Math.abs(dist - maskRadius);
        if (ringDist <= 1.5) {
          preview.data[idx] = 0x6B;
          preview.data[idx + 1] = 0x5B;
          preview.data[idx + 2] = 0x73;
          preview.data[idx + 3] = 255;
        } else {
          preview.data[idx] = 0x33;
          preview.data[idx + 1] = 0x33;
          preview.data[idx + 2] = 0x33;
          preview.data[idx + 3] = 255;
        }
      }
    }
  }

  return preview;
}

module.exports = {
  sampleBilinear,
  getArtworkBounds,
  recenterArtwork,
  createCirclePreview,
};
