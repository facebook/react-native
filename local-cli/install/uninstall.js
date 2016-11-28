const spawnSync = require('child_process').spawnSync;
const log = require('npmlog');
const yarn = require('../util/yarn');
const spawnOpts = {
  stdio: 'inherit',
  stdin: 'inherit',
};

log.heading = 'rnpm-install';

function uninstall(args, config) {
  const name = args[0];

  const projectDir = config.getProjectRoots()[0];
  const isYarnAvailable =
    yarn.getYarnVersionIfAvailable() &&
    yarn.isGlobalCliUsingYarn(projectDir);

  var res = spawnSync('rnpm', ['unlink', name], spawnOpts);

  if (res.status) {
    process.exit(res.status);
  }

  if (isYarnAvailable) {
    res = spawnSync('yarn', ['remove', name], spawnOpts);
  } else {
    res = spawnSync('npm', ['uninstall', name], spawnOpts);
  }

  if (res.status) {
    process.exit(res.status);
  }

  log.info(`Module ${name} has been successfully uninstalled & unlinked`);
}

module.exports = {
  func: uninstall,
  description: 'uninstall and unlink native dependencies',
  name: 'uninstall <packageName>',
};
