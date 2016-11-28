const spawnSync = require('child_process').spawnSync;
const log = require('npmlog');
const yarn = require('../util/yarn');
const spawnOpts = {
  stdio: 'inherit',
  stdin: 'inherit',
};

log.heading = 'rnpm-install';

function install(args, config) {
  const name = args[0];

  const projectDir = config.getProjectRoots()[0];
  const isYarnAvailable =
    yarn.getYarnVersionIfAvailable() &&
    yarn.isGlobalCliUsingYarn(projectDir);

  var res;
  if (isYarnAvailable) {
    res = spawnSync('yarn', ['add', name], spawnOpts);
  } else {
    res = spawnSync('npm', ['install', name, '--save'], spawnOpts);
  }

  if (res.status) {
    process.exit(res.status);
  }

  res = spawnSync('rnpm', ['link', name], spawnOpts);

  if (res.status) {
    process.exit(res.status);
  }

  log.info(`Module ${name} has been successfully installed & linked`);
}

module.exports = {
  func: install,
  description: 'install and link native dependencies',
  name: 'install <packageName>',
};
