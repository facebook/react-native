/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule openFileInEditor
 * @flow
 */
'use strict';

const getDevServer = require('getDevServer');

function openFileInEditor(file: string, lineNumber: number) {
  fetch(getDevServer().url + 'open-stack-frame', {
    method: 'POST',
    body: JSON.stringify({file, lineNumber}),
  });
}

module.exports = openFileInEditor;
