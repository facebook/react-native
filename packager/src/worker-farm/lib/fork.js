/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const childProcess = require('child_process');
const childModule = require.resolve('./child/index');

function fork(forkModule: string, options: {|+execArgv: Array<string>|}) {
  const child = childProcess.fork(childModule, {
    cwd: process.cwd(),
    env: process.env,
    execArgv: options.execArgv,
    silent: true,
  });

  child.send({module: forkModule});

  // return a send() function for this child
  return {
    send(data: {}) {
      try {
        child.send(data);
      } catch (e) {
        // this *should* be picked up by onExit and the operation requeued
      }
    },
    child,
  };
}

module.exports = fork;
