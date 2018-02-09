/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * For all files that are created and referenced from another `.xcodeproj` -
 * a new PBXItemContainerProxy is created that contains `containerPortal` value
 * which equals to xcodeproj file.uuid from PBXFileReference section.
 */
module.exports = function removeFromPbxItemContainerProxySection(project, file) {
  const section = project.hash.project.objects.PBXContainerItemProxy;

  for (var key of Object.keys(section)) {
    if (section[key].containerPortal === file.uuid) {
      delete section[key];
    }
  }

  return;
};
