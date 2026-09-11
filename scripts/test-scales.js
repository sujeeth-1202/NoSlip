const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const { recenterArtwork, createCirclePreview, getArtworkBounds } = require('./recenter-adaptive-icon');

const srcPath = path.join(__dirname, '../assets/images/android-icon-foreground.png');
const srcPng = PNG.sync.read(fs.readFileSync(srcPath));

const bounds = getArtworkBounds(srcPng);
console.log('Original bounds:', bounds);

const scales = [1.0, 1.3, 1.45, 1.6];

scales.forEach((scale) => {
  const { out: centered, bounds: originalBounds } = recenterArtwork(srcPng, scale, 1024, 1024);
  const newBounds = getArtworkBounds(centered);
  console.log(`Scale ${scale}: new bounds w=${newBounds.w}, h=${newBounds.h}, cx=${newBounds.cx}, cy=${newBounds.cy}, maxR=${newBounds.maxRadius.toFixed(1)}`);

  const preview = createCirclePreview(centered);
  const previewPath = path.join(__dirname, `../preview-adaptive-icon-scale-${scale}.png`);
  fs.writeFileSync(previewPath, PNG.sync.write(preview));
  console.log(`Saved preview to ${previewPath}`);
});
