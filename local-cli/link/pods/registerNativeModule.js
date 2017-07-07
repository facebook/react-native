'use strict';

const readPodfile = require('./readPodfile');
const findPodTargetLine = require('./findPodTargetLine');
const findLineToAddPod = require('./findLineToAddPod');
const addPodEntry = require('./addPodEntry');
const savePodFile = require('./savePodFile');

module.exports = function registerNativeModulePods(podName, iOSProject) {
  const podLines = readPodfile(iOSProject.podfile);

  const firstTargetLined = findPodTargetLine(podLines, iOSProject.projectName);
  const lineToAddEntry = findLineToAddPod(podLines, firstTargetLined);
  addPodEntry(podLines, lineToAddEntry, podName);
  savePodFile(iOSProject.podfile, podLines);
};
