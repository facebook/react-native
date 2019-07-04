/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const getDevServer = require('./getDevServer');

let ID = 0;

function logToConsole(
  level:
    | 'trace'
    | 'info'
    | 'warn'
    | 'log'
    | 'group'
    | 'groupCollapsed'
    | 'groupEnd'
    | 'debug',
  data: Array<mixed>,
) {
  let body;
  try {
    body = JSON.stringify({id: ID++, level, data});
  } catch (error) {
    body = JSON.stringify({id: ID++, level, data: [error.message]});
  }
  fetch(getDevServer().url + 'log-to-console', {
    method: 'POST',
    body,
  }).catch(e => {
    // ...Oh well!
    // If metro is running, logs should be sent to metro.
    // If metro is NOT running, this will throw an exception every time... and
    //  those exceptions will be caught and logged, which will throw another
    //  exception, etc, causing infinite exception loop which affects UI perf.
    // If we swallow silently here, that won't happen.
  });
}

module.exports = logToConsole;
