/**
 * Copyright (c) 2013-present, Facebook, Inc.
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
const PbxFile = require('xcode/lib/pbxFile');
const addProjectToLibraries = require('../../ios/addProjectToLibraries');
const removeProjectFromLibraries = require('../../ios/removeProjectFromLibraries');
const last = require('lodash').last;
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);

describe('ios::removeProjectFromLibraries', () => {
  beforeEach(() => {
    project.parseSync();

    addProjectToLibraries(
      project.pbxGroupByName('Libraries'),
      new PbxFile('fakePath')
    );
  });

  it('should remove file from Libraries group', () => {
    const file = new PbxFile('fakePath');
    const libraries = project.pbxGroupByName('Libraries');

    removeProjectFromLibraries(libraries, file);

    const child = last(libraries.children);

    expect(child.comment).not.toBe(file.basename);
  });
});
