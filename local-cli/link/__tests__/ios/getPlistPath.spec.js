'use strict';

const xcode = require('xcode');
const getPlistPath = require('../../ios/getPlistPath');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
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
