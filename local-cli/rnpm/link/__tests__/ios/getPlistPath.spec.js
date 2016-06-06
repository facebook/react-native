'use strict';

jest.autoMockOff();

const xcode = require('xcode');
const path = require('path');
const getPlistPath = require('../../src/ios/getPlistPath');

const project = xcode.project(
  path.join(__dirname, '../fixtures/project.pbxproj')
);

describe('ios::getPlistPath', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should return path without Xcode $(SRCROOT)', () => {
    const plistPath = getPlistPath(project, '/');
    expect(plistPath).toBe('/Basic/Info.plist');
  });
});
