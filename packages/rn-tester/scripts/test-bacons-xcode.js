/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const fs = require('fs');
const path = require('path');
const {XcodeProject} = require('@bacons/xcode');
const {build} = require('@bacons/xcode/json');

const xcodeProjectPath = path.join(
    'RNTesterPods.xcodeproj',
    'project.pbxproj',
  );
if (!fs.existsSync(xcodeProjectPath)) {
  throw new Error(`Xcode project not found: ${xcodeProjectPath}`);
}
console.log(`Opening Xcode project at ${xcodeProjectPath}...`);
const openStartTime = Date.now();
const project = XcodeProject.open(xcodeProjectPath);
console.log(`Xcode project has been opened in ${Date.now() - openStartTime} ms`);

console.log(`Converting the project back to a string`);
const buildStartTime = Date.now();
const pbxprojString = build(project);
console.log(`Xcode project has been converted in ${Date.now() - buildStartTime} ms`);

fs.writeFileSync(xcodeProjectPath, pbxprojString, 'utf8');
