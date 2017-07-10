'use strict';

module.exports = function addPodEntry(podLines, lineToAddEntry, podName, nodePath) {
  const newEntry = `  pod '${podName}', :path => '../node_modules/${nodePath}'\n`;

  podLines.splice(lineToAddEntry, 0, newEntry);
};
