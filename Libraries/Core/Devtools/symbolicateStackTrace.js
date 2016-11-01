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

const getDevServer = require('getDevServer');

const {SourceCode} = require('NativeModules');
const {fetch} = require('fetch');

import type {StackFrame} from 'parseErrorStack';

function isSourcedFromDisk(sourcePath: string): boolean {
  return !/^http/.test(sourcePath) && /[\\/]/.test(sourcePath);
}

async function symbolicateStackTrace(stack: Array<StackFrame>): Promise<Array<StackFrame>> {
  const devServer = getDevServer();
  if (!devServer.bundleLoadedFromServer) {
    throw new Error('Bundle was not loaded from the packager');
  }

  let stackCopy = stack;

  if (SourceCode.scriptURL) {
    let foundInternalSource: boolean = false;
    stackCopy = stack.map((frame: StackFrame) => {
      // If the sources exist on disk rather than appearing to come from the packager,
      // replace the location with the packager URL until we reach an internal source
      // which does not have a path (no slashes), indicating a switch from within
      // the application to a surrounding debugging environment.
      if (!foundInternalSource && isSourcedFromDisk(frame.file)) {
        // Copy frame into new object and replace 'file' property
        return {...frame, file: SourceCode.scriptURL};
      }

      foundInternalSource = true;
      return frame;
    });
  }

  const response = await fetch(devServer.url + 'symbolicate', {
    method: 'POST',
    body: JSON.stringify({stack: stackCopy}),
  });
  const json = await response.json();
  return json.stack;
}

module.exports = symbolicateStackTrace;
