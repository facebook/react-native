/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
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
