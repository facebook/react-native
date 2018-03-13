/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = function makeBuildPatch(name) {
  const installPattern = new RegExp(
    `\\s{4}(compile)(\\(|\\s)(project)\\(\\\':${name}\\\'\\)(\\)|\\s)`
  );

  return {
    installPattern,
    pattern: /[^ \t]dependencies {\n/,
    patch: `    compile project(':${name}')\n`
  };
};
