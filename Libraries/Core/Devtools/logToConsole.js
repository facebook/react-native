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
  level: 'trace' | 'info' | 'warn' | 'log',
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
  });
}

module.exports = logToConsole;
