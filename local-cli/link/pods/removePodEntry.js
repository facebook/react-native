/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

module.exports = function removePodEntry(podfileContent, podName) {
  // this regex should catch line(s) with full pod definition, like: pod 'podname', :path => '../node_modules/podname', :subspecs => ['Sub2', 'Sub1']
  const podRegex = new RegExp("\\n( |\\t)*pod\\s+(\"|')" + podName + "(\"|')(,\\s*(:[a-z]+\\s*=>)?\\s*((\"|').*?(\"|')|\\[[\\s\\S]*?\\]))*\\n", 'g');
  return podfileContent.replace(podRegex, '\n');
};
