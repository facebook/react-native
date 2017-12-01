'use strict';

const fs = require('fs');

module.exports = function readPodfile(podfilePath) {
  const podContent = fs.readFileSync(podfilePath, 'utf8');
  return podContent.split(/\r?\n/g);
};
