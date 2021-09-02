/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {parseString} = require('react-native-codegen/src/parsers/flow');
const RNCodegen = require('react-native-codegen/src/generators/RNCodegen');
const {basename} = require('path');

function generateViewConfig(filename, code) {
  const schema = parseString(code);

  const libraryName = basename(filename).replace(/NativeComponent\.js$/, '');
  return RNCodegen.generateViewConfig({
    schema,
    libraryName,
  });
}

function isCodegenDeclaration(declaration) {
  if (!declaration) {
    return false;
  }

  if (
    declaration.left &&
    declaration.left.left &&
    declaration.left.left.name === 'codegenNativeComponent'
  ) {
    return true;
  } else if (
    declaration.callee &&
    declaration.callee.name &&
    declaration.callee.name === 'codegenNativeComponent'
  ) {
    return true;
  } else if (
    declaration.type === 'TypeCastExpression' &&
    declaration.expression &&
    declaration.expression.callee &&
    declaration.expression.callee.name &&
    declaration.expression.callee.name === 'codegenNativeComponent'
  ) {
    return true;
  }

  return false;
}

module.exports = function(context) {
  return {
    pre(state) {
      this.code = state.code;
      this.filename = state.opts.filename;
      this.defaultExport = null;
      this.commandsExport = null;
      this.codeInserted = false;
    },
    visitor: {
      ExportNamedDeclaration(path) {
        if (this.codeInserted) {
          return;
        }

        if (
          path.node.declaration &&
          path.node.declaration.declarations &&
          path.node.declaration.declarations[0]
        ) {
          const firstDeclaration = path.node.declaration.declarations[0];

          if (firstDeclaration.type === 'VariableDeclarator') {
            if (
              firstDeclaration.init.type === 'CallExpression' &&
              firstDeclaration.init.callee.type === 'Identifier' &&
              firstDeclaration.init.callee.name === 'codegenNativeCommands'
            ) {
              if (
                firstDeclaration.id.type === 'Identifier' &&
                firstDeclaration.id.name !== 'Commands'
              ) {
                throw path.buildCodeFrameError(
                  "Native commands must be exported with the name 'Commands'",
                );
              }
              this.commandsExport = path;
              return;
            } else {
              if (firstDeclaration.id.name === 'Commands') {
                throw path.buildCodeFrameError(
                  "'Commands' is a reserved export and may only be used to export the result of codegenNativeCommands.",
                );
              }
            }
          }
        } else if (path.node.specifiers && path.node.specifiers.length > 0) {
          path.node.specifiers.forEach(specifier => {
            if (
              specifier.type === 'ExportSpecifier' &&
              specifier.local.type === 'Identifier' &&
              specifier.local.name === 'Commands'
            ) {
              throw path.buildCodeFrameError(
                "'Commands' is a reserved export and may only be used to export the result of codegenNativeCommands.",
              );
            }
          });
        }
      },
      ExportDefaultDeclaration(path, state) {
        if (isCodegenDeclaration(path.node.declaration)) {
          this.defaultExport = path;
        }
      },
      Program: {
        exit() {
          if (this.defaultExport) {
            const viewConfig = generateViewConfig(this.filename, this.code);
            this.defaultExport.replaceWithMultiple(
              context.parse(viewConfig).program.body,
            );
            if (this.commandsExport != null) {
              this.commandsExport.remove();
            }
            this.codeInserted = true;
          }
        },
      },
    },
  };
};
