'use strict';

jest.autoMockOff();
jest.mock('fs');

let plistPath = null;
jest.mock('../../ios/getPlistPath', () => () => plistPath);

const { readFileSync } = require.requireActual('fs')
const fs = require('fs');

const xcode = require('xcode');
const path = require('path');
const writePlist = require('../../ios/writePlist');

const projectPath = path.join(__dirname, '../../__fixtures__/project.pbxproj');
const infoPlistPath = path.join(__dirname, '../../__fixtures__/Info.plist');

fs.__setMockFilesystem({
  'Basic': {
    'project.pbxproj': readFileSync(projectPath).toString(),
  }
});

const project = xcode.project('/Basic/project.pbxproj');

const plist = {
  CFBundleDevelopmentRegion: 'en',
  UISupportedInterfaceOrientations: [
    'UIInterfaceOrientationPortrait'
  ]
};

describe('ios::writePlist', () => {
  beforeEach(() => {
    project.parseSync();
    fs.writeFileSync.mockReset();
  });

  it('should write a `.plist` file', () => {
    plistPath = '/Basic/Info.plist';
    const result = writePlist(project, '/', plist);
    const infoPlist = readFileSync(infoPlistPath).toString();
    expect(fs.writeFileSync).toHaveBeenCalledWith(plistPath, infoPlist);
  });

  it('when plistPath is null it should return null', () => {
    plistPath = null;
    expect(writePlist(project, '/', plist)).toBeNull();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
});
