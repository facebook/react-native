/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const readPodfile = require('./readPodfile');
const findPodTargetLine = require('./findPodTargetLine');
const findLineToAddPod = require('./findLineToAddPod');
const findMarkedLinesInPodfile = require('./findMarkedLinesInPodfile');
const addPodEntry = require('./addPodEntry');
const savePodFile = require('./savePodFile');

module.exports = function registerNativeModulePods(
  name,
  dependencyConfig,
  iOSProject,
) {
  const podLines = readPodfile(iOSProject.podfile);
  const linesToAddEntry = getLinesToAddEntry(podLines, iOSProject);
  addPodEntry(podLines, linesToAddEntry, dependencyConfig.podspec, name);
  savePodFile(iOSProject.podfile, podLines);
};

function getLinesToAddEntry(podLines, {projectName}) {
  const linesToAddPodWithMarker = findMarkedLinesInPodfile(podLines);
  if (linesToAddPodWithMarker.length > 0) {
    return linesToAddPodWithMarker;
  } else {
    const firstTargetLined = findPodTargetLine(podLines, projectName);
    return findLineToAddPod(podLines, firstTargetLined);
  }
}
