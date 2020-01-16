/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

 /*global expect*/

'use strict';

// munges string so that it's nice to look at in a test diff
function strip(str) {
  // Trim leading and trailing WS
  str = str.replace(/^\s+/, '');
  str = str.replace(/\s+$/, '');

  // Collapse all repeating newlines (possibly with spaces in between) into a
  // single newline
  str = str.replace(/\n(\s*)/g, '\n');

  // Collapse all non-newline whitespace into a single space
  return str.replace(/[^\S\n]+/g, ' ');
}

export function expectCodeIsEqual(actual, expected) {
  expect(strip(actual)).toBe(strip(expected));
}

export class FakeWritable {
  constructor() {
    this.result = '';
  }

  write(str) {
    this.result += str;
  }

  get() {
    return this.result;
  }
}
