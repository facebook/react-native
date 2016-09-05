const fs = require('fs');
const xml = require('xmldoc');

/**
 * @param  {String} manifestPath
 * @return {XMLDocument} Parsed manifest's content
 */
module.exports = function readManifest(manifestPath) {
  return new xml.XmlDocument(fs.readFileSync(manifestPath, 'utf8'));
};
