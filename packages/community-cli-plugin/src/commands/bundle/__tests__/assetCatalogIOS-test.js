/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {
  getCatalogImages,
  getImageSet,
  isAnimatedPNG,
  isCatalogAsset,
} from '../assetCatalogIOS';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

jest.dontMock('../assetCatalogIOS');

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

function makeAsset(scales: Array<number>) {
  return {
    __packager_asset: true,
    fileSystemLocation: '/project/img',
    httpServerLocation: '/assets/img',
    width: 100,
    height: 100,
    scales,
    files: scales.map(
      scale => `/project/img/logo${scale === 1 ? '' : `@${scale}x`}.png`,
    ),
    hash: 'hash',
    name: 'logo',
    type: 'png',
  };
}

describe('getCatalogImages', () => {
  test('pairs each standard scale with its file', () => {
    const asset = makeAsset([1, 2, 3]);
    expect(getCatalogImages(asset)).toEqual([
      {scale: 1, src: '/project/img/logo.png'},
      {scale: 2, src: '/project/img/logo@2x.png'},
      {scale: 3, src: '/project/img/logo@3x.png'},
    ]);
  });

  test('skips non-standard scales without shifting file pairing', () => {
    // Regression test: filtering scales without filtering files used to
    // associate the 2x rendition with the 1.5x file.
    const asset = makeAsset([1, 1.5, 2, 3]);
    expect(getCatalogImages(asset)).toEqual([
      {scale: 1, src: '/project/img/logo.png'},
      {scale: 2, src: '/project/img/logo@2x.png'},
      {scale: 3, src: '/project/img/logo@3x.png'},
    ]);
  });

  test('maps a fractional-only asset into the nearest valid slot', () => {
    const asset = makeAsset([1.5]);
    expect(getCatalogImages(asset)).toEqual([
      {scale: 2, src: '/project/img/logo@1.5x.png'},
    ]);
  });

  test('clamps scales larger than 3x to the 3x slot', () => {
    const asset = makeAsset([4]);
    expect(getCatalogImages(asset)).toEqual([
      {scale: 3, src: '/project/img/logo@4x.png'},
    ]);
  });

  test('uses the largest fractional variant when several exist', () => {
    const asset = makeAsset([1.5, 2.5]);
    expect(getCatalogImages(asset)).toEqual([
      {scale: 3, src: '/project/img/logo@2.5x.png'},
    ]);
  });
});

describe('getImageSet', () => {
  test('builds imageset path and per-scale file entries', () => {
    const asset = makeAsset([1, 2, 3]);
    const imageSet = getImageSet('/catalog', asset);
    expect(imageSet.basePath).toBe(path.join('/catalog', 'img_logo.imageset'));
    expect(imageSet.files).toEqual([
      {name: 'img_logo.png', scale: 1, src: '/project/img/logo.png'},
      {name: 'img_logo@2x.png', scale: 2, src: '/project/img/logo@2x.png'},
      {name: 'img_logo@3x.png', scale: 3, src: '/project/img/logo@3x.png'},
    ]);
  });

  test('names the fallback rendition after its catalog slot', () => {
    const asset = makeAsset([1.5]);
    const imageSet = getImageSet('/catalog', asset);
    expect(imageSet.files).toEqual([
      {name: 'img_logo@2x.png', scale: 2, src: '/project/img/logo@1.5x.png'},
    ]);
  });
});

describe('isAnimatedPNG', () => {
  const PNG_SIGNATURE = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  // CRCs are not validated by the detector, so chunks carry a zero CRC.
  function chunk(type: string, data: Buffer = Buffer.alloc(0)): Buffer {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    return Buffer.concat([
      length,
      Buffer.from(type, 'latin1'),
      data,
      Buffer.alloc(4),
    ]);
  }

  const IHDR = chunk('IHDR', Buffer.alloc(13));
  const IDAT = chunk('IDAT', Buffer.from([0x78, 0x9c, 0x03, 0x00]));
  const IEND = chunk('IEND');
  const acTL = chunk('acTL', Buffer.alloc(8));

  let dir: string;

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'assetCatalogIOS-'));
  });

  afterAll(() => {
    fs.rmSync(dir, {recursive: true, force: true});
  });

  function writeFile(name: string, ...parts: Array<Buffer>): string {
    const file = path.join(dir, name);
    fs.writeFileSync(file, Buffer.concat(parts));
    return file;
  }

  test('detects an acTL chunk before the first IDAT', () => {
    const file = writeFile(
      'animated.png',
      PNG_SIGNATURE,
      IHDR,
      acTL,
      IDAT,
      IEND,
    );
    expect(isAnimatedPNG(file)).toBe(true);
  });

  test('skips over chunk data when walking the headers', () => {
    const large = chunk('iCCP', Buffer.alloc(70000));
    const file = writeFile(
      'icc.png',
      PNG_SIGNATURE,
      IHDR,
      large,
      acTL,
      IDAT,
      IEND,
    );
    expect(isAnimatedPNG(file)).toBe(true);
  });

  test('is false for a still PNG', () => {
    const file = writeFile('still.png', PNG_SIGNATURE, IHDR, IDAT, IEND);
    expect(isAnimatedPNG(file)).toBe(false);
  });

  test('is false for a file without the PNG signature', () => {
    const file = writeFile('not.png', Buffer.from('not a png'));
    expect(isAnimatedPNG(file)).toBe(false);
  });

  test('is false for a file truncated inside the chunk headers', () => {
    const file = writeFile('truncated.png', PNG_SIGNATURE, IHDR.subarray(0, 6));
    expect(isAnimatedPNG(file)).toBe(false);
  });

  test('is false for a missing file', () => {
    expect(isAnimatedPNG(path.join(dir, 'missing.png'))).toBe(false);
  });

  describe('isCatalogAsset', () => {
    function makeFileAsset(type: string, files: Array<string>) {
      return {
        ...makeAsset(files.map((_, idx) => idx + 1)),
        files,
        type,
      };
    }

    test('keeps a still PNG in the catalog', () => {
      const file = writeFile('logo.png', PNG_SIGNATURE, IHDR, IDAT, IEND);
      expect(isCatalogAsset(makeFileAsset('png', [file]))).toBe(true);
    });

    test('keeps an animated PNG out of the catalog', () => {
      const file = writeFile(
        'spinner.png',
        PNG_SIGNATURE,
        IHDR,
        acTL,
        IDAT,
        IEND,
      );
      expect(isCatalogAsset(makeFileAsset('png', [file]))).toBe(false);
    });

    test('keeps the whole asset out when only one scale is animated', () => {
      const still = writeFile('mixed.png', PNG_SIGNATURE, IHDR, IDAT, IEND);
      const animated = writeFile(
        'mixed@2x.png',
        PNG_SIGNATURE,
        IHDR,
        acTL,
        IDAT,
        IEND,
      );
      expect(isCatalogAsset(makeFileAsset('png', [still, animated]))).toBe(
        false,
      );
    });

    test('does not read non-PNG assets', () => {
      expect(
        isCatalogAsset(makeFileAsset('jpg', [path.join(dir, 'missing.jpg')])),
      ).toBe(true);
      expect(
        isCatalogAsset(makeFileAsset('gif', [path.join(dir, 'missing.gif')])),
      ).toBe(false);
    });
  });
});
