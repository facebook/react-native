'use strict';

module.exports = function findLineToAddPod(podLines, firstTargetLine){

  for (let i = firstTargetLine, len = podLines.length; i < len; i++) {
    const match = podLines[i].match(/target \'\w+\' do/g) || podLines[i].match(/^\s*end\s*$/g);
    if (match) {
      return i;
    }
  }
  return null;
};
