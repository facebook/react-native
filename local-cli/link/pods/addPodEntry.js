'use strict';

module.exports = function addPodEntry(podLines, lineToAddEntry, podName) {
  podLines.splice(lineToAddEntry, 0, `  pod '${podName}', :path => '../node_modules/${podName}'`)
};
