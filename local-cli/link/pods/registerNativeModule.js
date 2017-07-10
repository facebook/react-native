'use strict';

const readPodfile = require('./readPodfile');
const findPodTargetLine = require('./findPodTargetLine');
const findLineToAddPod = require('./findLineToAddPod');
const addPodEntry = require('./addPodEntry');
const savePodFile = require('./savePodFile');

module.exports = function registerNativeModulePods(dependency, iOSProject) {
  const podLines = readPodfile(iOSProject.podfile);

  const firstTargetLined = findPodTargetLine(podLines, iOSProject.projectName);
  const lineToAddEntry = findLineToAddPod(podLines, firstTargetLined);
  addPodEntry(podLines, lineToAddEntry, dependency.config.ios.podspec, dependency.name);
  savePodFile(iOSProject.podfile, podLines);
};
