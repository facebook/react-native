/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const normalizeProjectName = require('./normalizeProjectName');

module.exports = function makeBuildPatch(name) {
  const normalizedProjectName = normalizeProjectName(name);
  const installPattern = new RegExp(
    `\\s{4}(implementation)(\\(|\\s)(project)\\(\\\':${normalizedProjectName}\\\'\\)(\\)|\\s)`,
  );

  return {
    installPattern,
    pattern: /[^ \t]dependencies {(\r\n|\n)/,
    patch: `    implementation project(':${normalizedProjectName}')\n`,
  };
};
