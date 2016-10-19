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

import type {TransformedFile} from '../types.flow';

module.exports = class Module {
  hasteID: Promise<?string>;
  name: Promise<string>;
  path: string;
  type: 'Module';

  constructor(path: string, info: Promise<TransformedFile>) {
    this.hasteID = info.then(({hasteID}) => hasteID);
    this.name = this.hasteID.then(name => name || getName(path));
    this.path = path;
    this.type = 'Module';
  }

  getName() {
    return this.name;
  }

  isHaste() {
    return this.hasteID.then(Boolean);
  }
};

function getName(path) {
  return path.replace(/^.*[\/\\]node_modules[\///]/, '');
}
