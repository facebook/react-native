/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule sequentialKey
 */

// Create a sequential key for rendered DOM elements to avoid:
//   "Each child in an array or iterator should have a unique "key" prop.""
// warnings. Given that the DOM for the docs will not have any state changes so
// the counter will always be the same and determinisic for any component.

var keyCounter = 0;

function sequentialKey() {
  return keyCounter++;
}

module.exports = sequentialKey;
