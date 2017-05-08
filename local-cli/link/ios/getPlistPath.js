const path = require('path');
const getBuildProperty = require('./getBuildProperty');

module.exports = function getPlistPath(project, sourceDir, projectConfig) {
  const plistFile = getBuildProperty(project, 'INFOPLIST_FILE', projectConfig);

  if (!plistFile) {
    return null;
  }

  return path.join(
    sourceDir,
    plistFile.replace(/"/g, '').replace('$(SRCROOT)', '')
  );
};
