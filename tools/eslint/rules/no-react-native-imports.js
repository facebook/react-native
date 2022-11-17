/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const RN_ROOT_DIRECTORY = path.resolve(__dirname, '..', '..', '..');
const RN_IMPORT_PATTERN = /^react-native(?:\/(?<relativeImport>.+))?$/;
const RN_IMPORT_EXTS = ['.android.js', '.ios.js', '.js'];

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: "Disallow importing from 'react-native'",
      recommended: true,
    },
    fixable: 'code',
    messages: {
      rnImport: "Use relative paths when importing within 'react-native'",
    },
    schema: [],
  },

  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1
        ) {
          processSource(node.arguments[0]);
        }
      },
      ImportExpression(node) {
        processSource(node.source);
      },
      ImportDeclaration(node) {
        processSource(node.source);
      },
    };

    function processSource(source) {
      if (source.type !== 'Literal' || typeof source.value !== 'string') {
        return;
      }
      const match = source.value.match(RN_IMPORT_PATTERN);
      if (match == null) {
        return;
      }
      let fix;
      // NOTE: We only attempt to resolve `react-native/<relativeImport>`. We
      // cannot safely fix named imports from `react-native` because the index
      // does arbitrary things like access the `default` property, etc.
      if (match.groups.relativeImport != null) {
        const suggestion = resolveRelativeImport(match.groups.relativeImport);
        if (suggestion != null) {
          fix = fixer => {
            const delimiter = source.raw[0];
            const replacement = [delimiter, suggestion, delimiter].join('');
            return fixer.replaceText(source, replacement);
          };
        }
      }
      context.report({
        node: source,
        messageId: 'rnImport',
        fix,
      });
    }

    function resolveRelativeImport(relativeImport) {
      const importPath = path.resolve(RN_ROOT_DIRECTORY, relativeImport);
      if (!isValidImportPath(importPath)) {
        return null;
      }
      const sourcePath = path.dirname(context.getPhysicalFilename());
      const relativePath = path.relative(sourcePath, importPath);
      // If importing from the same directory, prepend `./` to source path.
      const relativePathWithLeadingSlash = relativePath.includes(path.sep)
        ? relativePath
        : ['.', path.sep, relativePath].join('');
      // Normalize backslash (on Windows) to forward slash.
      return relativePathWithLeadingSlash.replace(/\\/g, '/');
    }

    function isValidImportPath(importPath) {
      const candidatePaths = [];
      if (importPath.endsWith('.js')) {
        candidatePaths.push(importPath);
      } else {
        for (const extension of RN_IMPORT_EXTS) {
          candidatePaths.push(importPath + extension);
        }
      }
      return candidatePaths.some(candidatePath => fs.existsSync(candidatePath));
    }
  },
};
