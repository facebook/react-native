/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * For all files that are created and referenced from another `.xcodeproj` -
 * a new PBXItemContainerProxy is created that contains `containerPortal` value
 * which equals to xcodeproj file.uuid from PBXFileReference section.
 */
module.exports = function removeFromPbxItemContainerProxySection(
  project,
  file,
) {
  const section = project.hash.project.objects.PBXContainerItemProxy;

  for (var key of Object.keys(section)) {
    if (section[key].containerPortal === file.uuid) {
      delete section[key];
    }
  }

  return;
};
