/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const createGroupWithMessage = require('./createGroupWithMessage');

module.exports = function addSharedLibraries(project, libraries) {
  if (!libraries.length) {
    return;
  }

  // Create a Frameworks group if necessary.
  createGroupWithMessage(project, 'Frameworks');

  const target = project.getFirstTarget().uuid;

  for (var name of libraries) {
    project.addFramework(name, {target});
  }
};
