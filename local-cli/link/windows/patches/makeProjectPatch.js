/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports = function makeProjectPatch(windowsConfig) {

  const projectInsert = `<ProjectReference Include="..\\${windowsConfig.relativeProjPath}">
      <Project>{${windowsConfig.pathGUID}}</Project>
      <Name>${windowsConfig.projectName}</Name>
    </ProjectReference>
    `;

  return {
    pattern: '<ProjectReference Include="..\\..\\node_modules\\react-native-windows\\ReactWindows\\ReactNative\\ReactNative.csproj">',
    patch: projectInsert,
    unpatch: new RegExp(`<ProjectReference.+\\s+.+\\s+.+${windowsConfig.projectName}.+\\s+.+\\s`),
  };
};
