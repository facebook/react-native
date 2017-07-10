'use strict';

module.exports = function findLineToAddPod(podLines, firstTargetLine){

  const nextTarget = /target \'\w+\' do/g;
  const endOfCurrentTarget = /^\s*end\s*$/g;
  const functionDefinition = /^\s*[a-z_]+\s+do(\s+\|[a-z]+\|)?/g;

  for (let i = firstTargetLine, len = podLines.length; i < len; i++) {
    const match = podLines[i].match(nextTarget) || podLines[i].match(endOfCurrentTarget) || podLines[i].match(functionDefinition);
    if (match) {
      return i;
    }
  }
  return null;
};
