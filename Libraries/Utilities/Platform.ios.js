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

var invariant = require('fbjs/lib/invariant');

var Platform = {
  OS: 'ios',
  select: (obj: Object) => {
    invariant(
      obj && typeof obj === 'object',
      'Platform.select: Must be called with an object'
    );
    return obj.ios;
  },
};

module.exports = Platform;
