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
  'Libraries/Network/XMLHttpRequest.js',
  'Libraries/WebSocket/WebSocket.js',

  // Parse errors introduced in hermes-parser 0.23.0:  Error: Comment location overlaps with node location
  'Libraries/Core/checkNativeVersion.js',
  'Libraries/Core/InitializeCore.js',
  'Libraries/Core/polyfillPromise.js',
  'Libraries/Core/setUpAlert.js',
  'Libraries/Core/setUpBatchedBridge.js',
  'Libraries/Core/setUpDeveloperTools.js',
  'Libraries/Core/setUpErrorHandling.js',
  'Libraries/Core/setUpGlobals.js',
  'Libraries/Core/setUpIntersectionObserver.js',
  'Libraries/Core/setUpMutationObserver.js',
  'Libraries/Core/setUpNavigator.js',
  'Libraries/Core/setUpPerformance.js',
  'Libraries/Core/setUpPerformanceObserver.js',
  'Libraries/Core/setUpReactDevTools.js',
  'Libraries/Core/setUpReactRefresh.js',
  'Libraries/Core/setUpRegeneratorRuntime.js',
  'Libraries/Core/setUpTimers.js',
  'Libraries/Core/setUpXHR.js',
  'Libraries/ReactPrivate/ReactNativePrivateInitializeCore.js',
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
  // Normalize newlines
  source = source.replace(/\r\n?/g, '\n');
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
