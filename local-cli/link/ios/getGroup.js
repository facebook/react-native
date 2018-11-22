/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const getFirstProject = project => project.getFirstProject().firstProject;

const findGroup = (groups, name) =>
  groups.children.find(group => group.comment === name);

/**
 * Returns group from .xcodeproj if one exists, null otherwise
 *
 * Unlike node-xcode `pbxGroupByName` - it does not return `first-matching`
 * group if multiple groups with the same name exist
 *
 * If path is not provided, it returns top-level group
 */
module.exports = function getGroup(project, path) {
  const firstProject = getFirstProject(project);

  let groups = project.getPBXGroupByKey(firstProject.mainGroup);

  if (!path) {
    return groups;
  }

  for (var name of path.split('/')) {
    var foundGroup = findGroup(groups, name);

    if (foundGroup) {
      groups = project.getPBXGroupByKey(foundGroup.value);
    } else {
      groups = null;
      break;
    }
  }

  return groups;
};
