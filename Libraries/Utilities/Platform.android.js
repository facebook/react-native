/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Platform
 * @flow
 */

'use strict';

const Platform = {
  OS: 'android',
  get Version() { return require('NativeModules').AndroidConstants.Version; },
  select: (obj: Object) => obj.android,
  lazySelect(obj: ?Object): ?Object {
    if (!obj || !obj.android) {
      return null;
    }

    return obj.android();
  },
};

module.exports = Platform;
