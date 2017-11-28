'use strict';

const fs = require('fs');

module.exports = function savePodFile(podfilePath, podLines) {
  const newPodfile = podLines.join('\n');
  fs.writeFileSync(podfilePath, newPodfile);
};
