/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');

module.exports = {
  getHasteName(filePath) {
    if (filePath.endsWith('ReactNativeInternalFeatureFlags.js')) {
      return 'ReactNativeInternalFeatureFlags';
    }

    return null;
  },

  getCacheKey() {
    return crypto
      .createHash('sha1')
      .update(fs.readFileSync(__filename))
      .digest('hex');
  },
};
