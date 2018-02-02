/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * All rights reserved.
 *
 * @emails oncall+javascript_foundation
 */

'use strict';

const path = require('path');
const findLineToAddPod = require('../../pods/findLineToAddPod');
const readPodfile = require('../../pods/readPodfile');

const PODFILES_PATH = path.join(__dirname, '../../__fixtures__/pods');
const LINE_AFTER_TARGET_IN_TEST_PODFILE = 4;

describe('pods::findLineToAddPod', () => {
  it('returns null if file is not Podfile', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, '../Info.plist'));
    expect(findLineToAddPod(podfile, LINE_AFTER_TARGET_IN_TEST_PODFILE)).toBeNull();
  });

  it('returns correct line number for Simple Podfile', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, 'PodfileSimple'));
    expect(findLineToAddPod(podfile, LINE_AFTER_TARGET_IN_TEST_PODFILE)).toEqual({ line: 7, indentation: 2 });
  });

  it('returns correct line number for Podfile with target', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, 'PodfileWithTarget'));
    expect(findLineToAddPod(podfile, LINE_AFTER_TARGET_IN_TEST_PODFILE)).toEqual({ line: 21, indentation: 2 });
  });

  it('returns correct line number for Podfile with function', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, 'PodfileWithFunction'));
    expect(findLineToAddPod(podfile, LINE_AFTER_TARGET_IN_TEST_PODFILE)).toEqual({ line: 26, indentation: 2 });
  });
});
