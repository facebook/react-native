'use strict';

module.exports = function addPodEntry(podLines, lineToAddEntry, podName) {
  const newEntry = `  pod '${podName}', :path => '../node_modules/${podName}'\n`;

  podLines.splice(lineToAddEntry, 0, newEntry)
};
