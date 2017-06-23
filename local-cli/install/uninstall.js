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
const PackageManager = require('../util/PackageManager');
const spawnOpts = {
  stdio: 'inherit',
  stdin: 'inherit',
};

log.heading = 'rnpm-install';

function uninstall(args, config, options) {
  const name = args[0];

  let res;
  if (!options.plugin) {
    res = spawnSync('react-native', ['unlink', name], spawnOpts);

    if (res.status) {
      process.exit(res.status);
    }
  }

  if (options.plugin) {
    res = PackageManager.removeDev(name);
  } else {
    res = PackageManager.remove(name);
  }

  if (res.status) {
    process.exit(res.status);
  }

  if (options.plugin) {
    log.info(`Plugin ${name} has been successfully uninstalled`);
  } else {
    log.info(`Module ${name} has been successfully uninstalled & unlinked`);
  }
}

module.exports = {
  func: uninstall,
  description: 'uninstall and unlink native dependencies',
  name: 'uninstall <packageName>',
  options: [{
    command: '--plugin',
    description: 'signals that the target is a plugin',
    default: false,
  }],
};
