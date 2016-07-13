/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule randomKey
 */

// Create a random key for rendered DOM elements to avoid:
//   "Each child in an array or iterator should have a unique "key" prop.""
// warnings.
function randomKey() {
  // http://stackoverflow.com/questions/10726909/random-alpha-numeric-string-in-javascript
  return Math.random().toString(36).slice(2);
}

module.exports = randomKey;
