/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

'use strict';

const path = require('path');

function parseArgs(args: string[]): {
  platform: ?string,
  outfile: string,
  fileList: string[],
} {
  if (args.length > 2 && ['-p', '--platform'].indexOf(args[2]) >= 0) {
    const [outfile, ...fileList] = args.slice(4);
    return {
      platform: args[3],
      outfile,
      fileList,
    };
  }

  const [outfile, ...fileList] = args.slice(2);
  return {
    platform: null,
    outfile,
    fileList,
  };
}

/**
 * This function is used by the CLI to decide whether a JS/TS file has to be processed or not by the Codegen.
 * Parameters:
 *   - file: the path to the file
 *   - currentPlatform: the current platform for which we are creating the specs
 * Returns: `true` if the file can be used to generate some code; `false` otherwise
 *
 */
function filterJSFile(file: string, currentPlatform: ?string): boolean {
  const isSpecFile = /^(Native.+|.+NativeComponent)/.test(path.basename(file));
  const isNotNativeUIManager = !file.endsWith('NativeUIManager.js');
  const isNotNativeSampleTurboModule = !file.endsWith(
    'NativeSampleTurboModule.js',
  );
  const isNotTest = !file.includes('__tests');
  const isNotTSTypeDefinition = !file.endsWith('.d.ts');

  const isValidCandidate =
    isSpecFile &&
    isNotNativeUIManager &&
    isNotNativeSampleTurboModule &&
    isNotTest &&
    isNotTSTypeDefinition;

  const filenameComponents = path.basename(file).split('.');
  const isPlatformAgnostic = filenameComponents.length === 2;

  if (currentPlatform == null) {
    // need to accept only files that are platform agnostic
    return isValidCandidate && isPlatformAgnostic;
  }

  // If a platform is passed, accept both platform agnostic specs...
  if (isPlatformAgnostic) {
    return isValidCandidate;
  }

  // ...and specs that share the same platform as the one passed.
  // specfiles must follow the pattern: <filename>[.<platform>].(js|ts|tsx)
  const filePlatform =
    filenameComponents.length > 2 ? filenameComponents[1] : 'unknown';
  return isValidCandidate && currentPlatform === filePlatform;
}

module.exports = {
  parseArgs,
  filterJSFile,
};
