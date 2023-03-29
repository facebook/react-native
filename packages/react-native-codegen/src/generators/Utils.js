/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

function capitalize(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function indent(nice: string, spaces: number): string {
  return nice
    .split('\n')
    .map((line, index) => {
      if (line.length === 0 || index === 0) {
        return line;
      }
      const emptySpaces = new Array<mixed>(spaces + 1).join(' ');
      return emptySpaces + line;
    })
    .join('\n');
}

module.exports = {
  capitalize,
  indent,
};
