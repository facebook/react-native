'use strict';

const readPodfile = require('./readPodfile');
const findPodTargetLine = require('./findPodTargetLine');
const findLineToAddPod = require('./findLineToAddPod');
const findMarkedLinesInPodfile = require('./findMarkedLinesInPodfile');
const addPodEntry = require('./addPodEntry');
const savePodFile = require('./savePodFile');

module.exports = function registerNativeModulePods(dependency, iOSProject) {
  const podLines = readPodfile(iOSProject.podfile);
  const linesToAddEntry = getLinesToAddEntry(podLines, iOSProject);
  addPodEntry(podLines, linesToAddEntry, dependency.config.ios.podspec, dependency.name);
  savePodFile(iOSProject.podfile, podLines);
};

function getLinesToAddEntry(podLines, { projectName }) {
  const linesToAddPodWithMarker = findMarkedLinesInPodfile(podLines);
  if (linesToAddPodWithMarker.length > 0) {
    return linesToAddPodWithMarker;
  } else {
    const firstTargetLined = findPodTargetLine(podLines, projectName);
    return findLineToAddPod(podLines, firstTargetLined);
  }
}
