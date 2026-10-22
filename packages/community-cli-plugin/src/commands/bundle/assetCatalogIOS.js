/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {AssetData} from 'metro';

import {ALLOWED_SCALES} from './filterPlatformAssetScales';
import {getAndroidResourceIdentifier} from '@react-native/asset-utils';
import fs from 'node:fs';
import path from 'node:path';

export function cleanAssetCatalog(catalogDir: string): void {
  const files = fs
    .readdirSync(catalogDir)
    .filter(file => file.endsWith('.imageset'));
  for (const file of files) {
    fs.rmSync(path.join(catalogDir, file), {recursive: true, force: true});
  }
}

type ImageSet = {
  basePath: string,
  files: {name: string, src: string, scale: number}[],
};

// Scales an iOS asset catalog imageset can hold. actool silently drops
// renditions at any other scale (e.g. a fractional @1.5x).
const CATALOG_SCALES = ALLOWED_SCALES.ios;

type CatalogImage = {scale: number, src: string};

/**
 * Pairs each catalog-valid scale of the asset with its source file.
 *
 * If the asset has no valid scale at all (e.g. only a fractional @1.5x
 * variant), its closest variant is mapped into the nearest valid slot,
 * mirroring the "closest larger" fallback filterPlatformAssetScales applies
 * to loose files, so the imageset always contains at least one rendition
 * actool will compile.
 */
export function getCatalogImages(asset: AssetData): Array<CatalogImage> {
  const images: Array<CatalogImage> = [];
  asset.scales.forEach((scale, idx) => {
    if (CATALOG_SCALES.includes(scale)) {
      images.push({scale, src: asset.files[idx]});
    }
  });
  if (images.length === 0 && asset.scales.length > 0) {
    const maxCatalogScale = CATALOG_SCALES[CATALOG_SCALES.length - 1];
    let idx = asset.scales.findIndex(scale => scale > maxCatalogScale);
    if (idx === -1) {
      idx = asset.scales.length - 1;
    }
    const scale = Math.min(
      maxCatalogScale,
      Math.max(1, Math.ceil(asset.scales[idx])),
    );
    console.warn(
      `warning: Asset "${asset.name}" has no 1x/2x/3x variant; ` +
        `using its @${asset.scales[idx]}x file as the ${scale}x catalog rendition.`,
    );
    images.push({scale, src: asset.files[idx]});
  }
  return images;
}

export function getImageSet(catalogDir: string, asset: AssetData): ImageSet {
  const fileName = getAndroidResourceIdentifier(asset);
  return {
    basePath: path.join(catalogDir, `${fileName}.imageset`),
    files: getCatalogImages(asset).map(({scale, src}) => {
      const suffix = scale === 1 ? '' : `@${scale}x`;
      return {
        name: `${fileName + suffix}.${asset.type}`,
        scale,
        src,
      };
    }),
  };
}

export function isCatalogAsset(asset: AssetData): boolean {
  if (asset.type === 'png') {
    // The runtime resolves an asset by name, so all of its scales must be
    // either in the catalog or loose.
    return !asset.files.some(isAnimatedPNG);
  }
  return asset.type === 'jpg' || asset.type === 'jpeg';
}

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/**
 * Whether the file is an animated PNG: a PNG with an `acTL` chunk before its
 * first `IDAT` (https://www.w3.org/TR/png-3/#acTL-chunk). actool compiles
 * such a file into a single still frame, so it must stay a loose file.
 *
 * Only the chunk headers are read. An unreadable or malformed file is reported
 * as not animated so that it stays on the catalog path, where actool reports it.
 */
export function isAnimatedPNG(filePath: string): boolean {
  let fd = null;
  try {
    fd = fs.openSync(filePath, 'r');
    const signature = Buffer.alloc(PNG_SIGNATURE.length);
    if (
      fs.readSync(fd, signature, 0, signature.length, 0) !== signature.length ||
      !signature.equals(PNG_SIGNATURE)
    ) {
      return false;
    }
    const chunkHeader = Buffer.alloc(8);
    let position = signature.length;
    while (fs.readSync(fd, chunkHeader, 0, 8, position) === 8) {
      const dataLength = chunkHeader.readUInt32BE(0);
      const type = chunkHeader.toString('latin1', 4, 8);
      if (type === 'acTL') {
        return true;
      }
      if (type === 'IDAT' || type === 'IEND') {
        return false;
      }
      // Skip the chunk data and its 4-byte CRC.
      position += 8 + dataLength + 4;
    }
    return false;
  } catch {
    return false;
  } finally {
    if (fd != null) {
      fs.closeSync(fd);
    }
  }
}

export function writeImageSet(imageSet: ImageSet): void {
  fs.mkdirSync(imageSet.basePath, {recursive: true});

  for (const file of imageSet.files) {
    const dest = path.join(imageSet.basePath, file.name);
    fs.copyFileSync(file.src, dest);
  }

  fs.writeFileSync(
    path.join(imageSet.basePath, 'Contents.json'),
    JSON.stringify({
      images: imageSet.files.map(file => ({
        filename: file.name,
        idiom: 'universal',
        scale: `${file.scale}x`,
      })),
      info: {
        author: 'xcode',
        version: 1,
      },
    }),
  );
}
