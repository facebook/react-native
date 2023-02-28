/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

const getDevServer = require('./getDevServer');

function openURLInBrowser(url: string) {
  fetch(getDevServer().url + 'open-url', {
    method: 'POST',
    body: JSON.stringify({url}),
  });
}

module.exports = openURLInBrowser;
