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

/*::
import type {TransformVisitor} from 'hermes-transform';
import type {TransformASTResult} from 'hermes-transform/dist/transform/transformAST';
import type {ParseResult} from 'hermes-transform/dist/transform/parse';
 */

const {transformAST} = require('hermes-transform/dist/transform/transformAST');

const visitors /*: TransformVisitor */ = context => ({
  // TODO
});

async function stripPrivateProperties(
  source /*: ParseResult */,
) /*: Promise<TransformASTResult> */ {
  return transformAST(source, visitors);
}

module.exports = stripPrivateProperties;
