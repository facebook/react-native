/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const fetch = require('node-fetch');

/**
 * Indicates whether or not the packager is running. It returns a promise that
 * when fulfilled can returns one out of these possible values:
 *   - `running`: the packager is running
 *   - `not_running`: the packager nor any process is running on the expected
 *                    port.
 *   - `unrecognized`: one other process is running on the port we expect the
 *                     packager to be running.
 */
function isPackagerRunning(packagerPort = process.env.RCT_METRO_PORT || 8081) {
  return fetch(`http://localhost:${packagerPort}/status`).then(
    res =>
      res
        .text()
        .then(
          body =>
            body === 'packager-status:running' ? 'running' : 'unrecognized',
        ),
    () => 'not_running',
  );
}

module.exports = isPackagerRunning;
