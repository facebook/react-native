/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

const xcode = require('xcode');
const path = require('path');
const getBuildProperty = require('../../ios/getBuildProperty');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj'),
);

describe('ios::getBuildProperty', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should return build property from main target', () => {
    const plistPath = getBuildProperty(project, 'INFOPLIST_FILE');
    expect(plistPath).toEqual('Basic/Info.plist');
  });
});
