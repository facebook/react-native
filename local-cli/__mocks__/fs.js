/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const path = require('path');
const MemoryFS = require('metro-memory-fs');
let fs;

function setMockFilesystem(object, platform) {
  reset(platform);
  const root = platform === 'win32' ? 'c:\\' : '/';
  mockDir(root, {...object});
  return root;
}

function mockDir(dirPath, desc) {
  for (const entName in desc) {
    const ent = desc[entName];
    const entPath = path.join(dirPath, entName);
    if (typeof ent === 'string' || ent instanceof Buffer) {
      fs.writeFileSync(entPath, ent);
      continue;
    }
    if (typeof ent !== 'object') {
      throw new Error(require('util').format('invalid entity:', ent));
    }
    if (ent.SYMLINK != null) {
      fs.symlinkSync(ent.SYMLINK, entPath);
      continue;
    }
    fs.mkdirSync(entPath);
    mockDir(entPath, ent);
  }
}

function reset(platform) {
  if (path.mock == null) {
    throw new Error(
      'to use this "fs" module mock, you must also mock the "path" module',
    );
  }
  path.mock.reset(platform);
  const cwd = () => (platform === 'win32' ? 'c:\\' : '/');
  fs = new MemoryFS({platform, cwd});
  Object.assign(mockFs, fs);
}

const mockFs = {};
mockFs.__setMockFilesystem = setMockFilesystem;
mockFs.mock = {clear: reset};

reset('posix');

module.exports = mockFs;
