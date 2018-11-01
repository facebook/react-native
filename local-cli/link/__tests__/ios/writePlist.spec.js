/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

jest.mock('path');
jest.mock('fs');

let plistPath = null;
jest.mock('../../ios/getPlistPath', () => () => plistPath);

const {readFileSync} = jest.requireActual('fs');
const fs = require('fs');

const xcode = require('xcode');
const writePlist = require('../../ios/writePlist');

const realPath = jest.requireActual('path');
const projectPath = realPath.join(
  __dirname,
  '../../__fixtures__/project.pbxproj',
);
const infoPlistPath = realPath.join(__dirname, '../../__fixtures__/Info.plist');

fs.readFileSync = jest.fn(() => readFileSync(projectPath).toString());

const {writeFileSync} = fs;
fs.writeFileSync = jest.fn(writeFileSync);

const project = xcode.project('/Basic/project.pbxproj');

const plist = {
  CFBundleDevelopmentRegion: 'en',
  UISupportedInterfaceOrientations: ['UIInterfaceOrientationPortrait'],
};

describe('ios::writePlist', () => {
  beforeEach(() => {
    project.parseSync();
    fs.writeFileSync.mockReset();
  });

  it('should write a `.plist` file', () => {
    plistPath = '/Basic/Info.plist';
    writePlist(project, '/', plist);
    const infoPlist = readFileSync(infoPlistPath).toString();
    expect(fs.writeFileSync).toHaveBeenCalledWith(plistPath, infoPlist);
  });

  it('when plistPath is null it should return null', () => {
    plistPath = null;
    expect(writePlist(project, '/', plist)).toBeNull();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
});
