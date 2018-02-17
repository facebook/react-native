/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const PbxFile = require('xcode/lib/pbxFile');
const removeFromPbxItemContainerProxySection = require('./removeFromPbxItemContainerProxySection');
const removeFromProjectReferences = require('./removeFromProjectReferences');
const removeProductGroup = require('./removeProductGroup');

/**
 * Given xcodeproj and filePath, it creates new file
 * from path provided and removes it. That operation is required since
 * underlying method requires PbxFile instance to be passed (it does not
 * have to have uuid or fileRef defined since it will do equality check
 * by path)
 *
 * Returns removed file (that one will have UUID)
 */
module.exports = function removeProjectFromProject(project, filePath) {
  const file = project.removeFromPbxFileReferenceSection(new PbxFile(filePath));
  const projectRef = removeFromProjectReferences(project, file);

  if (projectRef) {
    removeProductGroup(project, projectRef.ProductGroup);
  }

  removeFromPbxItemContainerProxySection(project, file);

  return file;
};
