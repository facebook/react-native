/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';
const MARKER_TEXT = '# Add new pods below this line';

module.exports = function findMarkedLinesInPodfile(podLines) {
  const result = [];
  for (let i = 0, len = podLines.length; i < len; i++) {
    if (podLines[i].includes(MARKER_TEXT)) {
      result.push({ line: i + 1, indentation: podLines[i].indexOf('#') });
    }
  }
  return result;
};
