'use strict';

jest.autoMockOff();

const xcode = require('xcode');
const path = require('path');
const getBuildProperty = require('../../ios/getBuildProperty');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);

describe('ios::getBuildProperty', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should return build property from main target', () => {
    const plistPath = getBuildProperty(project, 'INFOPLIST_FILE');
    expect(plistPath).toEqual('"Basic/Info.plist"');
  });
});
