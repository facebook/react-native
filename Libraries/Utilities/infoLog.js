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

/**
 * Intentional info-level logging for clear separation from ad-hoc console debug logging.
 */
function infoLog(...args: Array<mixed>): void {
  return console.log(...args);
}

module.exports = infoLog;
