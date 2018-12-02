/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

module.exports = function removeProductGroup(project, productGroupId) {
  const section = project.hash.project.objects.PBXGroup;

  for (var key of Object.keys(section)) {
    if (key === productGroupId) {
      delete section[key];
    }
  }

  return;
};
