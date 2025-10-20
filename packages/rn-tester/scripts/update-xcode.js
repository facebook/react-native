/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {build} = require('@bacons/xcode/json');
const {XcodeProject} = require('@bacons/xcode');
const fs = require('fs')
const path = require('path')

function main() {
  const xcodeProjectPath = path.join(
    'RNTesterPods.xcodeproj',
    'project.pbxproj',
  );
  if (!fs.existsSync(xcodeProjectPath)) {
    throw new Error(`Xcode project not found: ${xcodeProjectPath}`);
  }
  const project = XcodeProject.open(xcodeProjectPath);

  const pbxprojString = build(project.toJSON());
  fs.writeFileSync(xcodeProjectPath, pbxprojString, 'utf8');
}

main();
