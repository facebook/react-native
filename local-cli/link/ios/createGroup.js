/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const getGroup = require('./getGroup');

const hasGroup = (pbxGroup, name) => pbxGroup.children.find(group => group.comment === name);

/**
 * Given project and path of the group, it deeply creates a given group
 * making all outer groups if necessary
 *
 * Returns newly created group
 */
module.exports = function createGroup(project, path) {
  return path.split('/').reduce(
    (group, name) => {
      if (!hasGroup(group, name)) {
        const uuid = project.pbxCreateGroup(name, '""');

        group.children.push({
          value: uuid,
          comment: name,
        });
      }

      return project.pbxGroupByName(name);
    },
    getGroup(project)
  );
};
