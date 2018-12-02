/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
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
