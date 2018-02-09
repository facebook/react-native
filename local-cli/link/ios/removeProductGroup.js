/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
