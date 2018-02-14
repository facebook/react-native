/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
