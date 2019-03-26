/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * Given xcodeproj it returns list of products ending with
 * .a extension, so that we know what elements add to target
 * project static library
 */
module.exports = function getProducts(project) {
  return project
    .pbxGroupByName('Products')
    .children.map(c => c.comment)
    .filter(c => c.indexOf('.a') > -1);
};
