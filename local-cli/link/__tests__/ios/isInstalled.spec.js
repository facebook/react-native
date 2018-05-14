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

const path = require('path');
const isInstalled = require('../../ios/isInstalled');

const baseProjectConfig = {
  pbxprojPath: path.join(__dirname, '../../__fixtures__/project.pbxproj'),
  libraryFolder: 'Libraries',
};

describe('ios::isInstalled', () => {
  it('should return true when .xcodeproj in Libraries', () => {
    const dependencyConfig = {projectName: 'React.xcodeproj'};
    expect(isInstalled(baseProjectConfig, dependencyConfig)).toBeTruthy();
  });

  it('should return false when .xcodeproj not in Libraries', () => {
    const dependencyConfig = {projectName: 'Missing.xcodeproj'};
    expect(isInstalled(baseProjectConfig, dependencyConfig)).toBeFalsy();
  });

  it('should return false when `LibraryFolder` is missing', () => {
    const dependencyConfig = {projectName: 'React.xcodeproj'};
    const projectConfig = Object.assign({}, baseProjectConfig, {
      libraryFolder: 'Missing',
    });
    expect(isInstalled(projectConfig, dependencyConfig)).toBeFalsy();
  });
});
