/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

let savePodFileMock = jest.fn();
jest.mock('../../pods/savePodFile', () => savePodFileMock);

const path = require('path');
const registerNativeModule = require('../../pods/registerNativeModule');

const PODFILES_PATH = path.join(__dirname, '../../__fixtures__/pods');

describe('pods::registerNativeModule', () => {
  beforeEach(() => {
    savePodFileMock.mockClear();
  });

  const dependencyConfig = { podspec: 'SomePod' };

  it('adds a new podspec correctly', () => {

    const iOSProject = {
      projectName: 'Testing.xcodeproj',
      podfile: path.join(PODFILES_PATH, 'PodfileSimple')
    };

    registerNativeModule('some-dep', dependencyConfig, iOSProject);
    expect(savePodFileMock.mock.calls[0][1][7]).toEqual("  pod 'SomePod', :path => '../node_modules/some-dep'\n");
  });

  it('throws an error when no markers are found', () => {
    const iOSProject = {
      projectName: 'Testing.xcodeproj',
      podfile: path.join(PODFILES_PATH, 'PodfileWithNoRecognizableMarker')
    };

    expect(() =>
      registerNativeModule('some-dep', dependencyConfig, iOSProject)
    ).toThrow('Couldn\'t find "# Add new pods below this line" or "target \'Testing\' do" in Podfile, unable to continue');
  });
});
