/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports = function makeSolutionPatch(windowsConfig) {

  const solutionInsert = `Project("{${windowsConfig.projectGUID.toUpperCase()}}") = "${windowsConfig.projectName}", "${windowsConfig.relativeProjPath}", "{${windowsConfig.pathGUID.toUpperCase()}}"
EndProject
`;

  return {
    pattern: 'Global',
    patch: solutionInsert,
    unpatch: new RegExp(`Project.+${windowsConfig.projectName}.+\\s+EndProject\\s+`),
  };
};
