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
const addFileToProject = require('../../ios/addFileToProject');
const _ = require('lodash');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);

describe('ios::addFileToProject', () => {
  beforeEach(() => {
    project.parseSync();
  });

  xit('should add file to a project', () => {
    expect(
      _.includes(
        Object.keys(project.pbxFileReferenceSection()),
        addFileToProject(project, '../../__fixtures__/linearGradient.pbxproj').fileRef
      )
    ).toBeTruthy();
  });
});
