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
const getPlist = require('../../ios/getPlist');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);

describe('ios::getPlist', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should return null when `.plist` file missing', () => {
    const plistPath = getPlist(project, process.cwd());
    expect(plistPath).toBeNull();
  });

  // @todo - Happy scenario
});
