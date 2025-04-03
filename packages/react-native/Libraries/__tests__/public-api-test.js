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

const {
  visitors: stripPrivateProperties,
} = require('../../../../scripts/build-types/transforms/stripPrivateProperties');
const translate = require('flow-api-translator');
const {existsSync, promises: fs} = require('fs');
const glob = require('glob');
const {transform} = require('hermes-transform');
const path = require('path');

const PACKAGE_ROOT = path.resolve(__dirname, '../../');
const SHARED_PATTERNS = [
  '**/__{tests,mocks,fixtures,flowtests}__/**',
  '**/*.android.js',
  '**/*.ios.js',
  '**/*.fb.js',
  '**/*.macos.js',
  '**/*.windows.js',
];

const JS_LIBRARIES_FILES_PATTERN = 'Libraries/**/*.{js,flow}';
const JS_LIBRARIES_FILES_IGNORE_PATTERNS = [
  ...SHARED_PATTERNS,
  'Libraries/Core/setUp*',
  'Libraries/NewAppScreen/components/**',
  // Non source files
  'Libraries/Renderer/implementations/**',
  'Libraries/Renderer/shims/**',
  // ReactNativePrivateInterface
  'Libraries/ReactPrivate/**',
];
const JS_PRIVATE_FILES_INCLUDE_PATTERNS = [
  'setup/**/*.js',
  'specs/**/*.js',
  'types/**/*.js',
  'webapis/dom/geometry/*.js',
  'webapis/dom/nodes/*.js',
  'webapis/dom/oldstylecollections/*.js',
  'webapis/intersectionobserver/*.js',
  'webapis/mutationobserver/*.js',
  'webapis/performance/*.js',
];
const JS_PRIVATE_FILES_IGNORE_PATTERNS = SHARED_PATTERNS;

const sourceFiles = [
  'index.js.flow',
  ...glob.sync(JS_LIBRARIES_FILES_PATTERN, {
    cwd: PACKAGE_ROOT,
    ignore: JS_LIBRARIES_FILES_IGNORE_PATTERNS,
    nodir: true,
  }),
  ...JS_PRIVATE_FILES_INCLUDE_PATTERNS.flatMap(srcPrivateSubpath =>
    glob.sync(path.join('src', 'private', srcPrivateSubpath), {
      cwd: PACKAGE_ROOT,
      ignore: JS_PRIVATE_FILES_IGNORE_PATTERNS,
      nodir: true,
    }),
  ),
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
      if (
        source.includes('// $FlowFixMe[unsupported-syntax]') ||
        source.includes('// $FlowIssue[unsupported-syntax]')
      ) {
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
  const visitors: TransformVisitor = context => {
    return {
      ...stripPrivateProperties(context),
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
    };
  };

  const result = await transform(typeDefSource, visitors);

  // Remove empty lines (saves space, consistency fix on Windows)
  return result.replaceAll('\n\n', '\n');
}
