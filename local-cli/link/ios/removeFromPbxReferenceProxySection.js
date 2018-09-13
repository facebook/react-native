/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * Every file added to the project from another project is attached to
 * `PBXItemContainerProxy` through `PBXReferenceProxy`.
 */
module.exports = function removeFromPbxReferenceProxySection(project, file) {
  const section = project.hash.project.objects.PBXReferenceProxy;

  for (var key of Object.keys(section)) {
    if (section[key].path === file.basename) {
      delete section[key];
    }
  }

  return;
};
