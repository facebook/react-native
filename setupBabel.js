/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const babelRegisterOnly = require('metro/src/babelRegisterOnly');
const escapeRegExp = require('lodash/escapeRegExp');
const path = require('path');

const BABEL_ENABLED_PATHS = ['local-cli'];

/**
 * We use absolute paths for matching only the top-level folders reliably. For
 * example, we would not want to match some deeply nested forder that happens to
 * have the same name as one of `BABEL_ENABLED_PATHS`.
 */
function buildRegExps(basePath, dirPaths) {
  return dirPaths.map(
    folderPath =>
      // Babel `only` option works with forward slashes in the RegExp so replace
      // backslashes for Windows.
      folderPath instanceof RegExp
        ? new RegExp(
            `^${escapeRegExp(
              path.resolve(basePath, '.').replace(/\\/g, '/')
            )}/${folderPath.source}`,
            folderPath.flags
          )
        : new RegExp(
            `^${escapeRegExp(
              path.resolve(basePath, folderPath).replace(/\\/g, '/')
            )}`
          )
  );
}

function getOnlyList() {
  return buildRegExps(__dirname, BABEL_ENABLED_PATHS);
}

/**
 * Centralized place to register all the directories that need a Babel
 * transformation before being fed to Node.js. Notably, this is necessary to
 * support Flow type annotations.
 */
function setupBabel() {
  babelRegisterOnly(getOnlyList());
}

setupBabel.buildRegExps = buildRegExps;
setupBabel.getOnlyList = getOnlyList;
module.exports = setupBabel;
