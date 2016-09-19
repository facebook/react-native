const plistParser = require('plist');
const getPlistPath = require('./getPlistPath');
const fs = require('fs');

/**
 * Returns Info.plist located in the iOS project
 *
 * Returns `null` if INFOPLIST_FILE is not specified.
 */
module.exports = function getPlist(project, sourceDir) {
  const plistPath = getPlistPath(project, sourceDir);

  if (!plistPath || !fs.existsSync(plistPath)) {
    return null;
  }

  return plistParser.parse(
    fs.readFileSync(plistPath, 'utf-8')
  );
};
