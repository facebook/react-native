/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = jest.requireActual('fs');
const path = require('path');

exports.valid = {
  'demoProject.xcodeproj': {
    'project.pbxproj': fs.readFileSync(
      path.join(__dirname, './files/project.pbxproj'),
    ),
  },
  'TestPod.podspec': 'empty',
};

exports.validTestName = {
  'MyTestProject.xcodeproj': {
    'project.pbxproj': fs.readFileSync(
      path.join(__dirname, './files/project.pbxproj'),
    ),
  },
};

exports.pod = {
  'TestPod.podspec': 'empty',
};
