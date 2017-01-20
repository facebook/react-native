'use strict';

jest.autoMockOff();

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
