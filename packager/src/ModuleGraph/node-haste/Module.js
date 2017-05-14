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

import type {CachedReadResult, ReadResult} from '../../node-haste/Module';
import type {TransformedCodeFile} from '../types.flow';
import type ModuleCache from './ModuleCache';

module.exports = class Module {
  hasteID: ?string;
  moduleCache: ModuleCache;
  name: Promise<string>;
  path: string;
  type: 'Module';

  constructor(
    path: string,
    moduleCache: ModuleCache,
    info: TransformedCodeFile,
  ) {
    this.hasteID = info.hasteID;
    this.moduleCache = moduleCache;
    this.name = Promise.resolve(this.hasteID || getName(path));
    this.path = path;
    this.type = 'Module';
  }

  readCached(): CachedReadResult {
    throw new Error('not implemented');
  }

  readFresh(): Promise<ReadResult> {
    return Promise.reject(new Error('not implemented'));
  }

  getName() {
    return this.name;
  }

  getPackage() {
    return this.moduleCache.getPackageOf(this.path);
  }

  isHaste() {
    return Boolean(this.hasteID);
  }

  hash() {
    throw new Error('not implemented');
  }
};

function getName(path) {
  return path.replace(/^.*[\/\\]node_modules[\///]/, '');
}
