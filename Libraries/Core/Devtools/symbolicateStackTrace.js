/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const getDevServer = require('getDevServer');

const {SourceCode} = require('NativeModules');

// Avoid requiring fetch on load of this module; see symbolicateStackTrace
let fetch;

import type {StackFrame} from 'parseErrorStack';

function isSourcedFromDisk(sourcePath: string): boolean {
  return !/^http/.test(sourcePath) && /[\\/]/.test(sourcePath);
}

async function symbolicateStackTrace(
  stack: Array<StackFrame>,
): Promise<Array<StackFrame>> {
  // RN currently lazy loads whatwg-fetch using a custom fetch module, which,
  // when called for the first time, requires and re-exports 'whatwg-fetch'.
  // However, when a dependency of the project tries to require whatwg-fetch
  // either directly or indirectly, whatwg-fetch is required before
  // RN can lazy load whatwg-fetch. As whatwg-fetch checks
  // for a fetch polyfill before loading, it will in turn try to load
  // RN's fetch module, which immediately tries to import whatwg-fetch AGAIN.
  // This causes a circular require which results in RN's fetch module
  // exporting fetch as 'undefined'.
  // The fix below postpones trying to load fetch until the first call to symbolicateStackTrace.
  // At that time, we will have either global.fetch (whatwg-fetch) or RN's fetch.
  if (!fetch) {
    fetch = global.fetch || require('fetch').fetch;
  }

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
