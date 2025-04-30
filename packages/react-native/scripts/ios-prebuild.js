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

const {prepareHermesArtifactsAsync} = require('./ios-prebuild/hermes');
const {createFolderIfNotExists, createLink} = require('./ios-prebuild/utils');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Prebuilding React Native iOS...');
  console.log('');

  try {
    // Root
    const root = process.cwd();

    // Create build folder
    const buildFolder = path.resolve(root, '.build');
    createFolderIfNotExists(buildFolder);

    // Create the hard links folder
    const linksFolder = path.resolve(buildFolder, 'headers');
    createFolderIfNotExists(linksFolder);

    /**
     * Creates a symbolic link from one path to another. For each subfolder
     * in the source path, it creates a link in the target path with an
     * underscore prefix.
     * @param {string} fromPath - The path to the source file or directory
     * @param {string} includePath - Path in the headers folder to create the link
     * @throws {Error} If the source path does not exist or if the link creation fails
     * @returns {void}
     */
    const link = (fromPath /*:string*/, includePath /*:string*/) => {
      console.log(`Linking ${fromPath} to ${includePath}...`);
      const source = path.resolve(root, fromPath);
      const target = path.resolve(linksFolder, includePath);

      // get subfolders in source - make sure we only copy folders with header files
      const entries = fs.readdirSync(source, {withFileTypes: true});
      if (
        entries.some(
          dirent =>
            dirent.isFile() &&
            (dirent.name.endsWith('.h') || dirent.name.endsWith('.hpp')),
        )
      ) {
        // Create link for current folder
        try {
          createLink(source, target);
        } catch (e) {
          console.error(
            `Failed to create link for ${source} to ${target}: ${e}`,
          );
        }
      }

      const subfolders = entries
        .filter(dirent => dirent.isDirectory())
        .filter(dirent => dirent.name !== '__tests__')
        .map(dirent => dirent.name);

      // Create links for subfolders
      subfolders.forEach(folder => {
        link(fromPath + '/' + folder, '', includePath);
      });
    };

    // CODEGEN
    console.log('Running codegen...');
    const codegenPath = path.join(root, '.build/codegen');
    createFolderIfNotExists(codegenPath);

    const command = `node scripts/generate-codegen-artifacts -p "${root}" -o "${codegenPath}"  -t ios`;
    console.log(command);
    execSync(command);

    // HERMES ARTIFACTS
    console.log('Download hermes...');
    await prepareHermesArtifactsAsync('0.79.1', 'release');

    // LINKING
    link('Libraries/WebSocket/', 'React');
    link('React/Base', 'React');
    link('React/Base/Surface', 'React');
    link('React/CxxBridge', 'React');
    link('React/CxxModule', 'React');
    link('React/CxxUtils', 'React');
    link('React/DevSupport', 'React');
    link('React/Inspector', 'React');
    link('React/I18n', 'React');
    link('React/Views', 'React');
    link('React/CoreModules', 'React');
    link('React/Modules', 'React');
    link('React/Fabric', 'React');
    link('React/Profiler', 'React');
    link('React/CoreModules', 'React');
    link('React/Runtime', 'React');
    link('React/Views/ScrollView', 'React');
    link('React/Views/RefreshControl', 'React');

    link(
      'ReactApple/Libraries/RCTFoundation/RCTDeprecation/Exported',
      'RCTDeprecation',
    );
    link('Libraries/Required', 'RCTRequired');
    link('Libraries/TypeSafety', 'RCTTypeSafety');
    link('Libraries/Text', 'React');
    link('Libraries/Image', 'React');
    link('Libraries/Network', 'React');
    link('Libraries/Blob', 'React');
    link('Libraries/NativeAnimation', 'React');
    link('Libraries/LinkingIOS', 'React');

    link('ReactCommon/hermes', 'reacthermes');
    link('ReactCommon/hermes', 'jsireact');

    link(
      'ReactCommon/react/renderer/imagemanager',
      'react/renderer/imagemanager',
    );

    // Done!
    console.log('🏁 Done!');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  // eslint-disable-next-line no-void
  void main();
}
