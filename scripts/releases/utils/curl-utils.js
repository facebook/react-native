/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {promises: fs} = require('fs');
const spawnAsync = require('@expo/spawn-async');
const os = require('os');
const path = require('path');

/*::
type CurlResult = {
  data: Buffer,
  headers: {[string]: string},
};
*/

async function getWithCurl(url /*: string */) /*: Promise<CurlResult> */ {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'get-with-curl-'));
  const tempFile = path.join(tempDir, 'data');
  try {
    const {
      output: [curlStdout],
    } = await spawnAsync(
      'curl',
      [
        '--silent',
        '--location',
        '--output',
        tempFile,
        url,
        '--write-out',
        '%{header_json}',
      ],
      {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']},
    );
    const data = await fs.readFile(tempFile);
    const headers = JSON.parse(curlStdout);
    return {data, headers};
  } finally {
    await fs.rm(tempDir, {recursive: true, force: true});
  }
}

module.exports = {
  getWithCurl,
};
