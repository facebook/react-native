/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule infoLog
 */
'use strict';

/**
 * Intentional info-level logging for clear separation from ad-hoc console debug logging.
 */
function infoLog(...args) {
  return console.log(...args);
}

module.exports = infoLog;
