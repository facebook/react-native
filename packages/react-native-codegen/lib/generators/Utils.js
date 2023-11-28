/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict';

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
function indent(nice, spaces) {
  return nice
    .split('\n')
    .map((line, index) => {
      if (line.length === 0 || index === 0) {
        return line;
      }
      const emptySpaces = new Array(spaces + 1).join(' ');
      return emptySpaces + line;
    })
    .join('\n');
}
function toPascalCase(inString) {
  if (inString.length === 0) {
    return inString;
  }
  return inString[0].toUpperCase() + inString.slice(1);
}
function toSafeCppString(input) {
  return input.split('-').map(toPascalCase).join('');
}
function getEnumName(moduleName, origEnumName) {
  const uppercasedPropName = toSafeCppString(origEnumName);
  return `${moduleName}${uppercasedPropName}`;
}
module.exports = {
  capitalize,
  indent,
  toPascalCase,
  toSafeCppString,
  getEnumName,
};
