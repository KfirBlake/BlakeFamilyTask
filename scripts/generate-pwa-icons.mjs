import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputPath = path.join(process.cwd(), 'public/assets/images/logo.png');
const outputDir = path.join(process.cwd(), 'public/icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function generateIcons() {
  try {
    if (!fs.existsSync(inputPath)) {
      console.error('Source logo.png not found at:', inputPath);
      process.exit(1);
    }

    await sharp(inputPath)
      .resize(192, 192)
      .toFile(path.join(outputDir, 'icon-192x192.png'));
      
    await sharp(inputPath)
      .resize(512, 512)
      .toFile(path.join(outputDir, 'icon-512x512.png'));
      
    console.log('PWA icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
