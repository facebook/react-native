/**
 * Copyright (c) 2015-present, Facebook, Inc.
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
const findPodTargetLine = require('../../pods/findPodTargetLine');
const readPodfile = require('../../pods/readPodfile');

const PODFILES_PATH = path.join(__dirname, '../../__fixtures__/pods');

describe('pods::findPodTargetLine', () => {
  it('returns null if file is not Podfile', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, '../Info.plist'));
    expect(findPodTargetLine(podfile, 'name')).toBeNull();
  });

  it('returns null if there is not matching project name', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, 'PodfileSimple'));
    expect(findPodTargetLine(podfile, 'invalidName')).toBeNull();
  });

  it('returns null if there is not matching project name', () => {
    const podfile = readPodfile(path.join(PODFILES_PATH, 'PodfileSimple'));
    expect(findPodTargetLine(podfile, 'Testing')).toBe(4);
  });
});
