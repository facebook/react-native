/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule GLOBAL
 */

/* eslint strict: 0 */
/* globals GLOBAL: true, window: true */

if (typeof GLOBAL === 'undefined') {
  GLOBAL = this;
}

if (typeof window === 'undefined') {
  window = GLOBAL;
}

module.exports = GLOBAL;
