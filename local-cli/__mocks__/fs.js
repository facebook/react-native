/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const fs = new (require('metro-memory-fs'))({cwd: process.cwd});

function setMockFilesystem(object) {
  fs.reset();
  const root = process.platform === 'win32' ? 'c:\\' : '/';
  mockDir(root, {...object});
}

function mockDir(dirPath, desc) {
  for (const entName in desc) {
    const ent = desc[entName];
    const entPath = require('path').join(dirPath, entName);
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

fs.__setMockFilesystem = setMockFilesystem;
fs.mock = {clear: () => fs.reset()};

module.exports = fs;
