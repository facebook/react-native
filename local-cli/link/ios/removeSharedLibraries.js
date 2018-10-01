/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = function removeSharedLibraries(project, libraries) {
  if (!libraries.length) {
    return;
  }

  const target = project.getFirstTarget().uuid;

  for (var name of libraries) {
    project.removeFramework(name, {target});
  }
};
