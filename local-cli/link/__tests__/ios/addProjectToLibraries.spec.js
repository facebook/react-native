/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+javascript_foundation
 */

'use strict';

const xcode = require('xcode');
const path = require('path');
const PbxFile = require('xcode/lib/pbxFile');
const addProjectToLibraries = require('../../ios/addProjectToLibraries');
const last = require('lodash').last;

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);

describe('ios::addProjectToLibraries', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should append file to Libraries group', () => {
    const file = new PbxFile('fakePath');
    const libraries = project.pbxGroupByName('Libraries');

    addProjectToLibraries(libraries, file);

    const child = last(libraries.children);

    expect(child.comment).toBe(file.basename);
  });
});
