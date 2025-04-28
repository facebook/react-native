/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const {createFolderIfNotExists, createLink} = require('./ios-prebuild/utils');
const fs = require('fs');
const path = require('path');

function main() {
  console.log('Prebuilding React Native...');
  console.log('');

  // Root
  const root = process.cwd();

  // Create build folder
  const buildFolder = path.resolve(root, '.build');
  createFolderIfNotExists(buildFolder);

  // Create the hard links folder
  const linksFolder = path.resolve(buildFolder, 'includes');
  createFolderIfNotExists(linksFolder);

  /**
   * Creates a symbolic link from one path to another. For each subfolder
   * in the source path, it creates a link in the target path with an
   * underscore prefix.
   * @param {string} fromPath - The path to the source file or directory
   * @param {string} toPath - The path to the destination file or directory
   * @param {string} includePath - Path inside the toPath to create the link
   * @throws {Error} If the source path does not exist or if the link creation fails
   * @returns {void}
   */
  const link = (
    fromPath /*:string*/,
    toPath /*:string*/,
    includePath /*:string*/,
  ) => {
    if (toPath.includes('__tests__')) {
      // Skip test folders
      return;
    }

    console.log(`Linking ${fromPath} to ${toPath + '/' + includePath}...`);
    const source = path.resolve(root, fromPath);
    const target = path.resolve(linksFolder, toPath, includePath);

    // get subfolders in source
    const entries = fs.readdirSync(source, {withFileTypes: true});
    if (
      entries.some(
        dirent =>
          dirent.isFile() &&
          (dirent.name.endsWith('.h') || dirent.name.endsWith('.hpp')),
      )
    ) {
      // Create link for current folder
      createLink(source, target);
    }

    const subfolders = entries
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // Create links for subfolders
    subfolders.forEach(folder => {
      link(fromPath + '/' + folder, toPath + '_' + folder, includePath);
    });
  };

  link('Libraries/WebSocket/', 'WebSocket', 'React');
  link('React/Base', 'Base', 'React');
  link('React/Base/Surface', 'Surface', 'React');
  link('React/CxxBridge', 'CxxBridge', 'React');
  link('React/CxxModule', 'CxxModule', 'React');
  link('React/CxxUtils', 'CxxUtils', 'React');
  link('React/DevSupport', 'DevSupport', 'React');
  link('React/Inspector', 'Inspector', 'React');
  link('React/I18n', 'I18n', 'React');
  link('React/Views', 'Views', 'React');
  link('React/CoreModules', 'CoreModules', 'React');
  link('React/Modules', 'Modules', 'React');
  link('React/Fabric', 'Fabric', 'React');
  link('React/Profiler', 'Profiler', 'React');
  link('React/CoreModules', 'CoreModules', 'React');

  link('React/Runtime', 'Runtime', 'React');
  link('React/Views/ScrollView', 'ScrollView', 'React');
  link('React/Views/RefreshControl', 'RefreshControl', 'React');

  link(
    'ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported',
    'ReactApple/',
    'RCTDeprecation',
  );
  link('Libraries/Required', 'Required', 'RCTRequired');
  link('Libraries/TypeSafety', 'TypeSafety', 'RCTTypeSafety');
  link('Libraries/Text', 'Text', 'React');
  link('Libraries/Image', 'Image', 'React');
  link('Libraries/Network', 'Network', 'React');
  link('Libraries/Blob', 'Blob', 'React');
  link('Libraries/NativeAnimation', 'NativeAnimation', 'React');

  link('ReactCommon/hermes', 'Hermes', 'reacthermes');
  link('ReactCommon/hermes', 'Hermes', 'jsireact');

  console.log('🏁 Done!');
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
