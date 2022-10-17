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

const {ParserError} = require('./errors');

const path = require('path');

export type TypeDeclarationMap = {[declarationName: string]: $FlowFixMe};

export type TypeAliasResolutionStatus =
  | $ReadOnly<{
      successful: true,
      aliasName: string,
    }>
  | $ReadOnly<{
      successful: false,
    }>;

function extractNativeModuleName(filename: string): string {
  // this should drop everything after the file name. For Example it will drop:
  // .android.js, .android.ts, .android.tsx, .ios.js, .ios.ts, .ios.tsx, .js, .ts, .tsx
  return path.basename(filename).split('.')[0];
}

export type ParserErrorCapturer = <T>(fn: () => T) => ?T;

function createParserErrorCapturer(): [
  Array<ParserError>,
  ParserErrorCapturer,
] {
  const errors = [];
  function guard<T>(fn: () => T): ?T {
    try {
      return fn();
    } catch (error) {
      if (!(error instanceof ParserError)) {
        throw error;
      }
      errors.push(error);

      return null;
    }
  }

  return [errors, guard];
}

// TODO(T108222691): Use flow-types for @babel/parser
function visit(
  astNode: $FlowFixMe,
  visitor: {
    [type: string]: (node: $FlowFixMe) => void,
  },
) {
  const queue = [astNode];
  while (queue.length !== 0) {
    let item = queue.shift();

    if (!(typeof item === 'object' && item != null)) {
      continue;
    }

    if (
      typeof item.type === 'string' &&
      typeof visitor[item.type] === 'function'
    ) {
      // Don't visit any children
      visitor[item.type](item);
    } else if (Array.isArray(item)) {
      queue.push(...item);
    } else {
      queue.push(...Object.values(item));
    }
  }
}

module.exports = {
  extractNativeModuleName,
  createParserErrorCapturer,
  visit,
};
