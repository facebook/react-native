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

const spawnAsync = require('@expo/spawn-async');
const {promises: fs} = require('fs');
const os = require('os');
const path = require('path');

/*::
type CurlResult = {
  data: Buffer,
  headers: {[string]: Array<string>},
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
        '--fail',
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

function getTempDirPatternForTests() /*: RegExp */ {
  return new RegExp(
    escapeRegex(path.join(os.tmpdir(), 'get-with-curl-')) +
      '.[^\\s' +
      escapeRegex(path.sep) +
      ']+',
    'g',
  );
}

function escapeRegex(str /*: string */) /*: string */ {
  return str.replace(/[-[\]\\/{}()*+?.^$|]/g, '\\$&');
}

module.exports = {
  getWithCurl,
  getTempDirPatternForTests,
};
