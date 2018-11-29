/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/* eslint-disable no-bitwise */

'use strict';

/**
 * Module that provides a function for creating a unique identifier.
 * The returned value does not conform to the GUID standard, but should
 * be globally unique in the context of the browser.
 */
function guid() {
  return 'f' + (Math.random() * (1 << 30)).toString(16).replace('.', '');
}

module.exports = guid;
