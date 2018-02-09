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
const hasLibraryImported = require('../../ios/hasLibraryImported');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
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
