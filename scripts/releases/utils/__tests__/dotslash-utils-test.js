/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const fs = require('fs');

const {
  processDotSlashFileInPlace,
  dangerouslyResignGeneratedFile,
  validateAndParseDotSlashFile,
} = require('../dotslash-utils');

jest.useRealTimers();

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync('dotslash-utils-test-');
});

afterEach(() => {
  fs.rmSync(tmpDir, {recursive: true});
});

describe('processDotSlashFileInPlace', () => {
  test('succeeds on a minimal valid DotSlash file', async () => {
    const transformProviders = jest.fn();
    const contentsBefore = `#!/usr/bin/env dotslash
{
  "name": "test",
  "platforms": {}
}`;
    fs.writeFileSync(`${tmpDir}/entry-point`, contentsBefore);
    await processDotSlashFileInPlace(
      `${tmpDir}/entry-point`,
      transformProviders,
    );
    expect(transformProviders).not.toHaveBeenCalled();
    expect(fs.readFileSync(`${tmpDir}/entry-point`, 'utf8')).toBe(
      contentsBefore,
    );
  });

  test('comments, multiple platforms, providers + replacement', async () => {
    const transformProviders = jest.fn();
    const contentsBefore = `#!/usr/bin/env dotslash
// Top-level comment
{
  "name": "test",
  "platforms": {
    // Comment on linux-x86_64
    "linux-x86_64": {
      "size": 0,
      "hash": "sha256",
      "digest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "providers": [
        {"url": "https://primary.example.com/foo-linux.tar.gz", "weight": 3},
        {"url": "https://mirror1.example.com/foo-linux.tar.gz", "weight": 1},
        {"url": "https://mirror2.example.com/foo-linux.tar.gz", "weight": 1},
        {"url": "https://mirror3.example.com/foo-linux.tar.gz", "weight": 1}
      ],
      "format": "tar.gz",
      "path": "bar"
    },
    // Comment on macos-aarch64
    "macos-aarch64": {
      "size": 0,
      "hash": "sha256",
      "digest": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "providers": [
        {"url": "https://primary.example.com/foo-mac.zip", "weight": 3},
        {"url": "https://mirror1.example.com/foo-mac.zip", "weight": 1},
      ],
      "format": "zip",
      "path": "bar",
    }
  }
}`;
    fs.writeFileSync(`${tmpDir}/entry-point`, contentsBefore);
    transformProviders.mockImplementationOnce(
      (providers, suggestedFilename) => {
        return [
          {
            url:
              'https://example.com/replaced/' +
              encodeURIComponent(suggestedFilename),
          },
        ];
      },
    );
    transformProviders.mockImplementationOnce(
      (providers, suggestedFilename) => {
        return [
          ...providers,
          {
            url:
              'https://example.com/added/' +
              encodeURIComponent(suggestedFilename),
          },
        ];
      },
    );
    await processDotSlashFileInPlace(
      `${tmpDir}/entry-point`,
      transformProviders,
    );
    expect(transformProviders.mock.calls).toMatchSnapshot(
      'transformProviders calls',
    );
    expect(fs.readFileSync(`${tmpDir}/entry-point`, 'utf8')).toMatchSnapshot(
      'contents after processing',
    );
  });

  test('fails on an invalid DotSlash file (no shebang line)', async () => {
    const transformProviders = jest.fn();
    const contentsBefore = `{
  "name": "test",
  "platforms": {}
}`;
    fs.writeFileSync(`${tmpDir}/entry-point`, contentsBefore);
    await expect(
      processDotSlashFileInPlace(`${tmpDir}/entry-point`, transformProviders),
    ).rejects.toThrow();
    expect(transformProviders).not.toHaveBeenCalled();
    expect(fs.readFileSync(`${tmpDir}/entry-point`, 'utf8')).toBe(
      contentsBefore,
    );
  });

  test('fails on an invalid DotSlash file (no platforms)', async () => {
    const transformProviders = jest.fn();
    const contentsBefore = `#!/usr/bin/env dotslash
{
  "name": "test"
}`;
    fs.writeFileSync(`${tmpDir}/entry-point`, contentsBefore);
    await expect(
      processDotSlashFileInPlace(`${tmpDir}/entry-point`, transformProviders),
    ).rejects.toThrow();
    expect(transformProviders).not.toHaveBeenCalled();
    expect(fs.readFileSync(`${tmpDir}/entry-point`, 'utf8')).toBe(
      contentsBefore,
    );
  });
});

describe('dangerouslyResignGeneratedFile', () => {
  test('successfully re-signs a file', async () => {
    const contentsBefore = `#!/usr/bin/env dotslash
// @${'generated SignedSource<<00000000000000000000000000000000' + '>>'}
{
  "name": "test",
  "platforms": {}
}`;
    fs.writeFileSync(`${tmpDir}/entry-point`, contentsBefore);
    await dangerouslyResignGeneratedFile(`${tmpDir}/entry-point`);
    expect(fs.readFileSync(`${tmpDir}/entry-point`, 'utf8'))
      .toBe(`#!/usr/bin/env dotslash
// @${'generated SignedSource<<5ccb2839bdbd070dffcda52c6aa922a3' + '>>'}
{
  "name": "test",
  "platforms": {}
}`);
  });
});
