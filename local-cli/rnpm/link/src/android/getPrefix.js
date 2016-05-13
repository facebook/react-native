const semver = require('semver');
const versions = ['0.20', '0.18', '0.17'];

module.exports = function getPrefix(rnVersion) {
  const version = rnVersion.replace(/-.*/, '');
  var prefix = 'patches/0.20';

  versions.forEach((item, i) => {
    const nextVersion = versions[i + 1];
    if (semver.lt(version, item + '.0') && nextVersion) {
      prefix = `patches/${nextVersion}`;
    }
  });

  return prefix;
};
