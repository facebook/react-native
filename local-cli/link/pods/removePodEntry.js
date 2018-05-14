/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

module.exports = function removePodEntry(podfileContent, podName) {
  // this regex should catch line(s) with full pod definition, like: pod 'podname', :path => '../node_modules/podname', :subspecs => ['Sub2', 'Sub1']
  const podRegex = new RegExp(
    '\\n( |\\t)*pod\\s+("|\')' +
      podName +
      '("|\')(,\\s*(:[a-z]+\\s*=>)?\\s*(("|\').*?("|\')|\\[[\\s\\S]*?\\]))*\\n',
    'g',
  );
  return podfileContent.replace(podRegex, '\n');
};
