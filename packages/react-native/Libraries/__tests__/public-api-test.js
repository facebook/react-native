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

import type {TransformVisitor} from 'hermes-transform';

const translate = require('flow-api-translator');
const {promises: fs} = require('fs');
const glob = require('glob');
const {transform} = require('hermes-transform');
const os = require('os');
const path = require('path');

const PACKAGE_ROOT = path.resolve(__dirname, '../../');
const JS_FILES_PATTERN = 'Libraries/**/*.{js,flow}';
const IGNORE_PATTERNS = [
  '**/__{tests,mocks,fixtures,flowtests}__/**',
  '**/*.fb.js',
  '**/*.macos.js',
  '**/*.windows.js',
];

// Exclude list for files that fail to parse under flow-api-translator. Please
// review your changes before adding new entries.
const FILES_WITH_KNOWN_ERRORS = new Set([
  'Libraries/Blob/FileReader.js',
  'Libraries/Components/DrawerAndroid/DrawerLayoutAndroid.android.js',
  'Libraries/Components/Keyboard/KeyboardAvoidingView.js',
  'Libraries/Components/RefreshControl/RefreshControl.js',
  'Libraries/Components/ScrollView/ScrollView.js',
  'Libraries/Components/StatusBar/StatusBar.js',
  'Libraries/Components/StaticRenderer.js',
  'Libraries/Components/Touchable/TouchableNativeFeedback.js',
  'Libraries/Components/UnimplementedViews/UnimplementedView.js',
  'Libraries/Image/ImageBackground.js',
  'Libraries/Inspector/ElementProperties.js',
  'Libraries/Inspector/BorderBox.js',
  'Libraries/Inspector/BoxInspector.js',
  'Libraries/Inspector/InspectorPanel.js',
  'Libraries/Inspector/NetworkOverlay.js',
  'Libraries/Inspector/PerformanceOverlay.js',
  'Libraries/Inspector/StyleInspector.js',
  'Libraries/Inspector/ElementBox.js',
  'Libraries/Lists/FlatList.js',
  'Libraries/Lists/SectionList.js',
  'Libraries/LogBox/LogBoxInspectorContainer.js',
  'Libraries/Modal/Modal.js',
  'Libraries/Network/XMLHttpRequest.js',
  'Libraries/WebSocket/WebSocket.js',
]);

const sourceFiles = [
  'index.js',
  ...glob.sync(JS_FILES_PATTERN, {
    cwd: PACKAGE_ROOT,
    ignore: IGNORE_PATTERNS,
    nodir: true,
  }),
];

describe('public API', () => {
  if (os.platform() === 'win32') {
    // TODO(huntie): Re-enable once upstream flow-api-translator fixes are made
    // eslint-disable-next-line jest/no-focused-tests
    test.only('skipping tests on win32', () => {
      console.log('skipping tests');
    });
  }

  describe('should not change unintentionally', () => {
    test.each(sourceFiles)('%s', async (file: string) => {
      const source = await fs.readFile(path.join(PACKAGE_ROOT, file), 'utf-8');

      if (/@flow/.test(source)) {
        if (source.includes('// $FlowFixMe[unsupported-syntax]')) {
          expect(
            'UNTYPED MODULE (unsupported-syntax suppression)',
          ).toMatchSnapshot();
          return;
        }

        let success = false;
        try {
          expect(await translateFlowToExportedAPI(source)).toMatchSnapshot();

          success = true;
        } catch (e) {
          if (!FILES_WITH_KNOWN_ERRORS.has(file)) {
            console.error('Unable to parse file:', file, '\n' + e);
          }
        } finally {
          if (success && FILES_WITH_KNOWN_ERRORS.has(file)) {
            console.error(
              'Expected parse error, please remove file exclude from FILES_WITH_KNOWN_ERRORS:',
              file,
            );
          }
        }
      } else {
        expect('UNTYPED MODULE').toMatchSnapshot();
      }
    });
  });
});

async function translateFlowToExportedAPI(source: string): Promise<string> {
  // Convert to Flow typedefs
  const typeDefSource = await translate.translateFlowToFlowDef(source);

  // Remove comments and import declarations
  const visitors: TransformVisitor = context => ({
    Program(node) {
      // $FlowFixMe[cannot-write]
      delete node.docblock;

      for (const comment of node.comments) {
        context.removeComments(comment);
      }
    },
    ImportDeclaration(node) {
      context.removeNode(node);
    },
  });

  const result = await transform(typeDefSource, visitors);

  // Remove empty lines (saves space, consistency fix on Windows)
  return result.replaceAll('\n\n', '\n');
}
