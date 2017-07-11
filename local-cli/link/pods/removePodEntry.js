'use strict';

module.exports = function removePodEntry(podfileContent, podName) {
  // this regex should catch line(s) with full pod definition
  const podRegex = new RegExp("\\n( |\\t)*pod\\s+(\"|')" + podName + "(\"|')(,\\s*(:[a-z]+\\s*=>)?\\s*((\"|').*?(\"|')|\\[[\\s\\S]*?\\]))*\\n", 'g');
  return podfileContent.replace(podRegex, '\n');
};
