/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type {ExportDefaultDeclaration, Program} from 'hermes-estree/dist';
import type {TransformVisitor} from 'hermes-transform';
import type {ParseResult} from 'hermes-transform/dist/transform/parse';
import type {TransformASTResult} from 'hermes-transform/dist/transform/transformAST';

const {transformAST} = require('hermes-transform/dist/transform/transformAST');

const visitors: TransformVisitor = context => ({
  Program(node): void {
    const getExportDefaultDeclaration = (
      programNode: Program,
    ): [ExportDefaultDeclaration, string] | null => {
      for (const bodyNode of programNode.body) {
        if (bodyNode.type === 'ExportDefaultDeclaration') {
          if (bodyNode.declaration.type === 'Identifier') {
            return [bodyNode, bodyNode.declaration.name];
          }
        }
      }

      return null;
    };

    const exportDefaultDeclResult = getExportDefaultDeclaration(node);
    if (exportDefaultDeclResult == null) {
      return;
    }

    const [exportDefaultDecl, exportDefaultDeclName] = exportDefaultDeclResult;
    for (const bodyNode of node.body) {
      if (bodyNode.type === 'VariableDeclaration') {
        for (const decl of bodyNode.declarations) {
          if (
            decl.id.type === 'Identifier' &&
            decl.id.name === exportDefaultDeclName
          ) {
            const comments = context.getComments(bodyNode);
            if (comments != null) {
              context.addLeadingComments(exportDefaultDecl, comments);
              context.removeComments(comments);
            }
          }
        }
      }
    }
  },
});

async function moveComponentDocBlocks(
  source: ParseResult,
): Promise<TransformASTResult> {
  return transformAST(source, visitors);
}

module.exports = moveComponentDocBlocks;
