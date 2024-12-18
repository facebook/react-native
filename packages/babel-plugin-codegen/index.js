/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

let FlowParser, TypeScriptParser, RNCodegen;

const {cheap: traverseCheap} = require('@babel/traverse').default;
const {basename} = require('path');

try {
  FlowParser =
    require('@react-native/codegen/src/parsers/flow/parser').FlowParser;
  TypeScriptParser =
    require('@react-native/codegen/src/parsers/typescript/parser').TypeScriptParser;
  RNCodegen = require('@react-native/codegen/src/generators/RNCodegen');
} catch (e) {
  // Fallback to lib when source doesn't exit (e.g. when installed as a dev dependency)
  FlowParser =
    require('@react-native/codegen/lib/parsers/flow/parser').FlowParser;
  TypeScriptParser =
    require('@react-native/codegen/lib/parsers/typescript/parser').TypeScriptParser;
  RNCodegen = require('@react-native/codegen/lib/generators/RNCodegen');
}

const flowParser = new FlowParser();
const typeScriptParser = new TypeScriptParser();

function parseFile(filename, code) {
  if (filename.endsWith('js')) {
    return flowParser.parseString(code);
  }

  if (filename.endsWith('ts')) {
    return typeScriptParser.parseString(code);
  }

  throw new Error(
    `Unable to parse file '${filename}'. Unsupported filename extension.`,
  );
}

function generateViewConfig(filename, code) {
  const schema = parseFile(filename, code);

  const libraryName = basename(filename).replace(
    /NativeComponent\.(js|ts)$/,
    '',
  );
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
    (declaration.type === 'TypeCastExpression' ||
      declaration.type === 'AsExpression') &&
    declaration.expression &&
    declaration.expression.callee &&
    declaration.expression.callee.name &&
    declaration.expression.callee.name === 'codegenNativeComponent'
  ) {
    return true;
  } else if (
    declaration.type === 'TSAsExpression' &&
    declaration.expression &&
    declaration.expression.callee &&
    declaration.expression.callee.name &&
    declaration.expression.callee.name === 'codegenNativeComponent'
  ) {
    return true;
  }

  return false;
}

module.exports = function ({parse, types: t}) {
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
              firstDeclaration.init &&
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
        exit(path) {
          if (this.defaultExport) {
            const viewConfig = generateViewConfig(this.filename, this.code);

            const ast = parse(viewConfig, {
              babelrc: false,
              browserslistConfigFile: false,
              configFile: false,
            });

            // Almost the whole file is replaced with the viewConfig generated code that doesn't
            // have a clear equivalent code on the source file when the user debugs, so we point
            // it to the location of the default export that in that file, which is the closest
            // to representing the code that is being generated.
            // This is mostly useful when that generated code throws an error.
            traverseCheap(ast, node => {
              if (node?.loc) {
                node.loc = this.defaultExport.node.loc;
                node.start = this.defaultExport.node.start;
                node.end = this.defaultExport.node.end;
              }
            });

            this.defaultExport.replaceWithMultiple(ast.program.body);

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
