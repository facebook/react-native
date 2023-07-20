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

function openFileInEditor(file: string, lineNumber: number) {
  // $FlowFixMe[unused-promise]
  fetch(getDevServer().url + 'open-stack-frame', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({file, lineNumber}),
  });
}

module.exports = openFileInEditor;
