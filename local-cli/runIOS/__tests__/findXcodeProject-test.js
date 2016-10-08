/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

jest.dontMock('../findXcodeProject');

const findXcodeProject = require('../findXcodeProject');

describe('findXcodeProject', () => {
  it('should find *.xcodeproj file', () => {
    expect(findXcodeProject([
      '.DS_Store',
      'AwesomeApp',
      'AwesomeApp.xcodeproj',
      'AwesomeAppTests',
      'PodFile',
      'Podfile.lock',
      'Pods'
    ])).toEqual({
      name: 'AwesomeApp.xcodeproj',
      isWorkspace: false,
    });
  });

  it('should prefer *.xcworkspace', () => {
    expect(findXcodeProject([
      '.DS_Store',
      'AwesomeApp',
      'AwesomeApp.xcodeproj',
      'AwesomeApp.xcworkspace',
      'AwesomeAppTests',
      'PodFile',
      'Podfile.lock',
      'Pods'
    ])).toEqual({
      name: 'AwesomeApp.xcworkspace',
      isWorkspace: true,
    });
  });

  it('should return null if nothing found', () => {
    expect(findXcodeProject([
      '.DS_Store',
      'AwesomeApp',
      'AwesomeAppTests',
      'PodFile',
      'Podfile.lock',
      'Pods'
    ])).toEqual(null);
  });
});
