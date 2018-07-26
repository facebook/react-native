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
const hasLibraryImported = require('../../ios/hasLibraryImported');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj'),
);

describe('ios::hasLibraryImported', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should return true if project has been already imported', () => {
    const libraries = project.pbxGroupByName('Libraries');
    expect(hasLibraryImported(libraries, 'React.xcodeproj')).toBeTruthy();
  });

  it('should return false if project is not imported', () => {
    const libraries = project.pbxGroupByName('Libraries');
    expect(hasLibraryImported(libraries, 'ACME.xcodeproj')).toBeFalsy();
  });
});
