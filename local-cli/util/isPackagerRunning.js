/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fetch = require('node-fetch');

/**
 * Indicates whether or not the packager is running. It ruturns a promise that
 * when fulfilled can returns one out of these possible values:
 *   - `running`: the packager is running
 *   - `not_running`: the packager nor any process is running on the expected
 *                    port.
 *   - `unrecognized`: one other process is running on the port ew expect the
 *                     packager to be running.
 */
function isPackagerRunning() {
  return fetch('http://localhost:8081/status').then(
    res => res.text().then(body =>
      body === 'packager-status:running' ? 'running' : 'unrecognized'
    ),
    () => 'not_running'
  );
}

module.exports = isPackagerRunning;
