/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

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

  const projectDir = process.cwd();
  const isYarnAvailable =
    yarn.getYarnVersionIfAvailable() &&
    yarn.isGlobalCliUsingYarn(projectDir);

  let res;
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
