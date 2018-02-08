/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * All rights reserved.
 *
 * @emails oncall+javascript_foundation
 */

'use strict';

const xcode = require('xcode');
const path = require('path');
const getBuildProperty = require('../../ios/getBuildProperty');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
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
