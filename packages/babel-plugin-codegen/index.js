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

function isTurboModuleRequire(path) {
  if (path.node.type !== 'CallExpression') {
    return false;
  }

  const callExpression = path.node;

  if (callExpression.callee.type !== 'MemberExpression') {
    return false;
  }

  const memberExpression = callExpression.callee;
  if (
    !(
      memberExpression.object.type === 'Identifier' &&
      memberExpression.object.name === 'TurboModuleRegistry'
    )
  ) {
    return false;
  }

  if (
    !(
      memberExpression.property.type === 'Identifier' &&
      (memberExpression.property.name === 'get' ||
        memberExpression.property.name === 'getEnforcing')
    )
  ) {
    return false;
  }
  return true;
}

module.exports = function({parse, types: t}) {
  return {
    pre(state) {
      this.code = state.code;
      this.filename = state.opts.filename;
      this.defaultExport = null;
      this.commandsExport = null;
      this.codeInserted = false;

      /**
       * TurboModule JS Codegen State
       */
      this.turboModuleRequireCallExpressions = [];
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

      CallExpression(path) {
        if (isTurboModuleRequire(path)) {
          this.turboModuleRequireCallExpressions.push(path);
        }
      },

      Program: {
        exit(path) {
          if (this.defaultExport) {
            const viewConfig = generateViewConfig(this.filename, this.code);
            this.defaultExport.replaceWithMultiple(
              parse(viewConfig).program.body,
            );
            if (this.commandsExport != null) {
              this.commandsExport.remove();
            }
            this.codeInserted = true;
          }

          /**
           * Insert the TurboModule schema into the TurboModuleRegistry.(get|getEnforcing)
           * call.
           */

          // Disabling TurobModule processing for react-native-web NPM module
          // Workaround for T80868008, can remove after fixed
          const enableTurboModuleJSCodegen =
            this.filename.indexOf('/node_modules/react-native-web') === -1;

          if (
            this.turboModuleRequireCallExpressions.length > 0 &&
            enableTurboModuleJSCodegen
          ) {
            const schema = parseString(this.code, this.filename);
            const hasteModuleName = basename(this.filename).replace(
              /\.js$/,
              '',
            );
            const actualSchema = schema.modules[hasteModuleName];

            if (actualSchema.type !== 'NativeModule') {
              throw path.buildCodeFrameError(
                `Detected NativeModule require in module '${hasteModuleName}', but generated schema wasn't for a NativeModule.`,
              );
            }

            path.pushContainer(
              'body',
              parse(
                `function __getModuleSchema() {
                  if (!(global.RN$JSTurboModuleCodegenEnabled === true)) {
                    return undefined;
                  }

                  return ${JSON.stringify(actualSchema, null, 2)};
                }`,
              ).program.body[0],
            );

            this.turboModuleRequireCallExpressions.forEach(
              callExpressionPath => {
                callExpressionPath.pushContainer(
                  'arguments',
                  t.callExpression(t.identifier('__getModuleSchema'), []),
                );
              },
            );
          }
        },
      },
    },
  };
};
