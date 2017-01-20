'use strict';

jest.autoMockOff();

const xcode = require('xcode');
const getPlist = require('../../ios/getPlist');
const path = require('path');

const project = xcode.project(
  path.join(__dirname, '../../__fixtures__/project.pbxproj')
);

describe('ios::getPlist', () => {
  beforeEach(() => {
    project.parseSync();
  });

  it('should return null when `.plist` file missing', () => {
    const plistPath = getPlist(project, process.cwd());
    expect(plistPath).toBeNull();
  });

  // @todo - Happy scenario
});
