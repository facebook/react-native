/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @emails oncall+javascript_foundation
 */

'use strict';

const path = require('path');
const removePodEntry = require('../../pods/removePodEntry');
const readPodfile = require('../../pods/readPodfile');

const PODFILES_PATH = path.join(__dirname, '../../__fixtures__/pods');

describe('pods::removePodEntry', () => {
  it('should remove one line from Podfile with TestPod', () => {
    const {podfileContent, podLinesCount} = readTestPodFile('PodfileSimple');
    const podFileWithRemoved = removePodEntry(podfileContent, 'TestPod');
    const newLineCount = podFileWithRemoved.split('\n').length;
    expect(newLineCount).toBe(podLinesCount - 1);
  });

  it('should remove one line from Podfile with Yoga', () => {
    const {podfileContent, podLinesCount} = readTestPodFile(
      'PodfileWithTarget',
    );
    const podFileWithRemoved = removePodEntry(podfileContent, 'Yoga');
    const newLineCount = podFileWithRemoved.split('\n').length;
    expect(newLineCount).toBe(podLinesCount - 1);
  });

  it('should remove whole reference to React pod from Podfile', () => {
    const {podfileContent, podLinesCount} = readTestPodFile(
      'PodfileWithTarget',
    );
    const podFileWithRemoved = removePodEntry(podfileContent, 'React');
    const newLineCount = podFileWithRemoved.split('\n').length;
    expect(newLineCount).toBe(podLinesCount - 9);
  });
});

function readTestPodFile(fileName) {
  const podfileLines = readPodfile(path.join(PODFILES_PATH, fileName));
  return {
    podfileContent: podfileLines.join('\n'),
    podLinesCount: podfileLines.length,
  };
}
