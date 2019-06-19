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
const path = require('path');

function generateViewConfig(filename, code) {
  const schema = parseString(code);

  const libraryName = path
    .basename(filename)
    .replace(/NativeComponent\.js$/, '');
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
  }

  return false;
}

module.exports = function(context) {
  return {
    pre(state) {
      this.code = state.code;
      this.filename = state.opts.filename;
    },
    visitor: {
      ExportDefaultDeclaration(nodePath, state) {
        if (isCodegenDeclaration(nodePath.node.declaration)) {
          const viewConfig = generateViewConfig(this.filename, this.code);
          nodePath.replaceWithMultiple(context.parse(viewConfig).program.body);
        }
      },
    },
  };
};
