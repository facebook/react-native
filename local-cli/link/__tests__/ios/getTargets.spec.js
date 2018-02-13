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
const getTargets = require('../../ios/getTargets');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);

describe('ios::getTargets', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should return an array of project targets', () => {
    const targets = getTargets(project);
    expect(targets.length).toBe(2);
    expect(targets[0].name).toContain('Basic.app');
    expect(targets[1].name).toContain('BasicTests.xctest');
  });
});
