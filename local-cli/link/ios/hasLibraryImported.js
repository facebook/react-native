/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Given an array of libraries already imported and packageName that will be
 * added, returns true or false depending on whether the library is already linked
 * or not
 */
module.exports = function hasLibraryImported(libraries, packageName) {
  return libraries.children
    .filter(library => library.comment === packageName)
    .length > 0;
};
