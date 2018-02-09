/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Given an array of dependencies - it returns their RNPM config
 * if they were valid.
 */
module.exports = function getDependencyConfig(config, deps) {
  return deps.reduce((acc, name) => {
    try {
      return acc.concat({
        config: config.getDependencyConfig(name),
        name,
      });
    } catch (err) {
      console.log(err);
      return acc;
    }
  }, []);
};
