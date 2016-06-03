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
  OS: 'ios',
  select: (obj: Object) => obj.ios,
  lazySelect(obj: ?Object): ?Object {
    if (!obj || !obj.ios) {
      return null;
    }

    return obj.ios();
  },
};

module.exports = Platform;
