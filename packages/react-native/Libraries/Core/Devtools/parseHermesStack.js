/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

type HermesStackLocationNative = {|
  +type: 'NATIVE',
|};

type HermesStackLocationSource = {|
  +type: 'SOURCE',
  +sourceUrl: string,
  +line1Based: number,
  +column1Based: number,
|};

type HermesStackLocationBytecode = {|
  +type: 'BYTECODE',
  +sourceUrl: string,
  +line1Based: number,
  +virtualOffset0Based: number,
|};

type HermesStackLocation =
  | HermesStackLocationNative
  | HermesStackLocationSource
  | HermesStackLocationBytecode;

type HermesStackEntryFrame = {|
  +type: 'FRAME',
  +location: HermesStackLocation,
  +functionName: string,
|};

type HermesStackEntrySkipped = {|
  +type: 'SKIPPED',
  +count: number,
|};

type HermesStackEntry = HermesStackEntryFrame | HermesStackEntrySkipped;

export type HermesParsedStack = {|
  +message: string,
  +entries: $ReadOnlyArray<HermesStackEntry>,
|};

// Capturing groups:
// 1. function name
// 2. is this a native stack frame?
// 3. is this a bytecode address or a source location?
// 4. source URL (filename)
// 5. line number (1 based)
// 6. column number (1 based) or virtual offset (0 based)
const RE_FRAME = /^ {4}at (.+?)(?: \((native)\)?| \((address at )?(.+?):(\d+):(\d+)\))$/;

// Capturing groups:
// 1. count of skipped frames
const RE_SKIPPED = /^ {4}... skipping (\d+) frames$/;

function parseLine(line: string): ?HermesStackEntry {
  const asFrame = line.match(RE_FRAME);
  if (asFrame) {
    return {
      type: 'FRAME',
      functionName: asFrame[1],
      location:
        asFrame[2] === 'native'
          ? {type: 'NATIVE'}
          : asFrame[3] === 'address at '
          ? {
              type: 'BYTECODE',
              sourceUrl: asFrame[4],
              line1Based: Number.parseInt(asFrame[5], 10),
              virtualOffset0Based: Number.parseInt(asFrame[6], 10),
            }
          : {
              type: 'SOURCE',
              sourceUrl: asFrame[4],
              line1Based: Number.parseInt(asFrame[5], 10),
              column1Based: Number.parseInt(asFrame[6], 10),
            },
    };
  }
  const asSkipped = line.match(RE_SKIPPED);
  if (asSkipped) {
    return {
      type: 'SKIPPED',
      count: Number.parseInt(asSkipped[1], 10),
    };
  }
}

module.exports = function parseHermesStack(stack: string): HermesParsedStack {
  const lines = stack.split(/\n/);
  let entries = [];
  let lastMessageLine = -1;
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    if (!line) {
      continue;
    }
    const entry = parseLine(line);
    if (entry) {
      entries.push(entry);
      continue;
    }
    // No match - we're still in the message
    lastMessageLine = i;
    entries = [];
  }
  const message = lines.slice(0, lastMessageLine + 1).join('\n');
  return {message, entries};
};
