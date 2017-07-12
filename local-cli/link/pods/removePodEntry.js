'use strict';

module.exports = function removePodEntry(podfileContent, podName) {
  // this regex should catch line(s) with full pod definition, like: pod 'podname', :path => '../node_modules/podname', :subspecs => ['Sub2', 'Sub1']
  const podRegex = new RegExp("\\n( |\\t)*pod\\s+(\"|')" + podName + "(\"|')(,\\s*(:[a-z]+\\s*=>)?\\s*((\"|').*?(\"|')|\\[[\\s\\S]*?\\]))*\\n", 'g');
  return podfileContent.replace(podRegex, '\n');
};
