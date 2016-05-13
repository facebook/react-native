const spawnSync = require('child_process').spawnSync;
const log = require('npmlog');
const spawnOpts = {
  stdio: 'inherit',
  stdin: 'inherit',
};

log.heading = 'rnpm-install';

module.exports = function install(config, args, callback) {
  const name = args[0];

  var res = spawnSync('rnpm', ['unlink', name], spawnOpts);

  if (res.status) {
    process.exit(res.status);
  }

  res = spawnSync('npm', ['uninstall', name], spawnOpts);

  if (res.status) {
    process.exit(res.status);
  }

  log.info(`Module ${name} has been successfully uninstalled & unlinked`);
};
