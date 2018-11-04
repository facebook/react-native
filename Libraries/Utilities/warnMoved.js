/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const warning = require('fbjs/lib/warning');

const warnedApis: {[string]: boolean} = {};

/**
 * A simple function that warns the user once if an API has been moved to
 * another module.
 *
 * @param {string} api - The name of the API or component that moved
 * @param {string} destModule - The name of the module that the API moved to
 * @param {string} [renamed] - Optional; name of the API in the dest module,
 *                             if it was renamed
 */
function warnMoved(api: string, destModule: string, renamed?: string) {
  if (warnedApis[api]) {
    return;
  }

  const destName = renamed != null ? renamed : api;

  warning(
    false,
    `'${api}' has moved to another module and will be removed from 'react-native' ` +
      `in a future release. You can instead import it from the module '${destModule}':` +
      `\n  import {${destName}} from '${destModule}';`,
  );

  warnedApis[api] = true;
}

module.exports = warnMoved;
