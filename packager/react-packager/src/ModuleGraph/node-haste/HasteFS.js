/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const {dirname, join, parse} = require('path');

module.exports = class HasteFS {
  directories: Set<string>;
  directoryEntries: Map<string, Array<string>>;
  files: Set<string>;

  constructor(files: Array<string>) {
    this.directories = buildDirectorySet(files);
    this.directoryEntries = buildDirectoryEntries(files.map(parse));
    this.files = new Set(files);
  }

  closest(path: string, fileName: string): ?string {
    let {dir, root} = parse(path);
    do {
      const candidate = join(dir, fileName);
      if (this.files.has(candidate)) {
        return candidate;
      }
      dir = dirname(dir);
    } while (dir !== '.' && dir !== root);
    return null;
  }

  dirExists(path: string) {
    return this.directories.has(path);
  }

  exists(path: string) {
    return this.files.has(path);
  }

  getAllFiles() {
    return Array.from(this.files.keys());
  }

  matches(directory: string, pattern: RegExp) {
    const entries = this.directoryEntries.get(directory);
    return entries ? entries.filter(pattern.test, pattern) : [];
  }
};

function buildDirectorySet(files) {
  const directories = new Set();
  files.forEach(path => {
    let {dir, root} = parse(path);
    while (dir !== '.' && dir !== root && !directories.has(dir)) {
      directories.add(dir);
      dir = dirname(dir);
    }
  });
  return directories;
}

function buildDirectoryEntries(files) {
  const directoryEntries = new Map();
  files.forEach(({base, dir}) => {
    const entries = directoryEntries.get(dir);
    if (entries) {
      entries.push(base);
    } else {
      directoryEntries.set(dir, [base]);
    }
  });
  return directoryEntries;
}
