/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';
const log = require('npmlog');
const readPodfile = require('./readPodfile');
const findPodTargetLine = require('./findPodTargetLine');
const findLineToAddPod = require('./findLineToAddPod');
const findMarkedLinesInPodfile = require('./findMarkedLinesInPodfile');
const addPodEntry = require('./addPodEntry');
const savePodFile = require('./savePodFile');

const MARKER_TEXT = '# Add new pods below this line';

module.exports = function registerNativeModulePods(name, dependencyConfig, iOSProject) {
  log.info(`Adding podspec for ${name} to ${iOSProject}`);
  const podLines = readPodfile(iOSProject.podfile);
  const linesToAddEntry = getLinesToAddEntry(podLines, iOSProject);
  addPodEntry(podLines, linesToAddEntry, dependencyConfig.podspec, name);
  savePodFile(iOSProject.podfile, podLines);
};

function getLinesToAddEntry(podLines, iOSProject) {
  const targetName = iOSProject.projectName.replace('.xcodeproj', '');
  const linesToAddPodWithMarker = findMarkedLinesInPodfile(podLines, MARKER_TEXT);
  if (linesToAddPodWithMarker.length > 0) {
    return linesToAddPodWithMarker;
  } else {
    log.info(`Couldn't find "${MARKER_TEXT}" in Podfile, will try to find target...`);
    const firstTargetLined = findPodTargetLine(podLines, targetName);
    if (firstTargetLined) {
      return findLineToAddPod(podLines, firstTargetLined);
    } else {
      throw new Error(`Couldn't find "${MARKER_TEXT}" or "target '${targetName}' do" in Podfile, unable to continue`);
    }
  }
}
