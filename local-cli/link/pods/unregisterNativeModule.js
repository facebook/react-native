/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const fs = require('fs');
const removePodEntry = require('./removePodEntry');

/**
 * Unregister native module IOS with CocoaPods
 */
module.exports = function unregisterNativeModule(dependencyConfig, iOSProject) {
	const podContent = fs.readFileSync(iOSProject.podfile, 'utf8');
	const removed = removePodEntry(podContent, dependencyConfig.podspec);
	fs.writeFileSync(iOSProject.podfile, removed);
};
