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
const {existsSync, promises: fs} = require('fs');
const glob = require('glob');
const {transform} = require('hermes-transform');
const path = require('path');

const PACKAGE_ROOT = path.resolve(__dirname, '../../');
const JS_FILES_PATTERN = 'Libraries/**/*.{js,flow}';
const IGNORE_PATTERNS = [
  '**/__{tests,mocks,fixtures,flowtests}__/**',
  '**/*.android.js',
  '**/*.ios.js',
  '**/*.fb.js',
  '**/*.macos.js',
  '**/*.windows.js',
  // Non source files
  'Libraries/Renderer/implementations/**',
  'Libraries/Renderer/shims/**',
];

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

      if (!/@flow/.test(source)) {
        throw new Error(
          file +
            ' is untyped. All source files in the react-native package must be written using Flow (// @flow).',
        );
      }

      // Require and use adjacent .js.flow file when source file includes an
      // unsupported-syntax suppression
      if (source.includes('// $FlowFixMe[unsupported-syntax]')) {
        const flowDefPath = path.join(
          PACKAGE_ROOT,
          file.replace('.js', '.js.flow'),
        );

        if (!existsSync(flowDefPath)) {
          throw new Error(
            'Found an unsupported-syntax suppression in ' +
              file +
              ', meaning types cannot be parsed. Add an adjacent <module>.js.flow file to fix this!',
          );
        }

        return;
      }

      try {
        expect(await translateFlowToExportedAPI(source)).toMatchSnapshot();
      } catch (e) {
        throw new Error('Unable to parse file: ' + file + '\n\n' + e.message);
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
