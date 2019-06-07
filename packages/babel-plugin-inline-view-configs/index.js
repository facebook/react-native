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

module.exports = function(context) {
  return {
    pre(state) {
      this.code = state.code;
      this.filename = state.opts.filename;
      this.inserted = false;
    },
    visitor: {
      TypeAlias(nodePath, state) {
        if (
          !this.inserted &&
          nodePath.node.right &&
          nodePath.node.right.type === 'GenericTypeAnnotation' &&
          nodePath.node.right.id.name === 'CodegenNativeComponent'
        ) {
          const code = generateViewConfig(this.filename, this.code);

          // Remove the original export
          nodePath.parentPath.traverse({
            MemberExpression(exportPath) {
              if (exportPath.node.property.name === 'exports') {
                exportPath.parentPath.remove();
              }
            },
          });
          nodePath.insertAfter(context.parse(code).program.body);
          this.inserted = true;
        }
      },
    },
  };
};
