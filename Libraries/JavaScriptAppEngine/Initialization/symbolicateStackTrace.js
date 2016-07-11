/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule symbolicateStackTrace
 * @flow
 */
'use strict';

const {fetch} = require('fetch');
const getDevServer = require('getDevServer');

import type {StackFrame} from 'parseErrorStack';

async function symbolicateStackTrace(stack: Array<StackFrame>): Promise<Array<StackFrame>> {
  const devServer = getDevServer();
  if (!devServer.bundleLoadedFromServer) {
    throw new Error('Bundle was not loaded from the packager');
  }
  const response = await fetch(devServer.url + 'symbolicate', {
    method: 'POST',
    body: JSON.stringify({stack}),
  });
  const json = await response.json();
  return json.stack;
}

module.exports = symbolicateStackTrace;
