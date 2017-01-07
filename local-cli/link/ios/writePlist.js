const plistParser = require('plist');
const getPlistPath = require('./getPlistPath');
const fs = require('fs');

/**
 * Writes to Info.plist located in the iOS project
 *
 * Returns `null` if INFOPLIST_FILE is not specified or file is non-existent.
 */
module.exports = function writePlist(project, sourceDir, plist) {
  const plistPath = getPlistPath(project, sourceDir);

  if (!plistPath) {
    return null;
  }

  return fs.writeFileSync(
    plistPath,
    plistParser.build(plist, { indent: '\t', offset: -1 }) + '\n'
  );
};
