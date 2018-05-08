/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const spawnSync = require('child_process').spawnSync;
const log = require('npmlog');
const PackageManager = require('../util/PackageManager');
const spawnOpts = {
  stdio: 'inherit',
  stdin: 'inherit',
};

log.heading = 'rnpm-install';

function install(args, config) {
  const name = args[0];

  let res = PackageManager.add(name);

  if (res.status) {
    process.exit(res.status);
  }

  res = spawnSync('react-native', ['link', name], spawnOpts);

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
