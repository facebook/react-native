'use strict';
const MARKER_TEXT = '# Add new pods below this line';

module.exports = function findMarkedLinesInPodfile(podLines) {
  const result = [];
  for (let i = 0, len = podLines.length; i < len; i++) {
    if (podLines[i].includes(MARKER_TEXT)) {
      result.push({ line: i + 1, indentation: podLines[i].indexOf('#') });
    }
  }
  return result;
};
