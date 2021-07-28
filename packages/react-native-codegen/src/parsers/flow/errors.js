/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

class ParserError extends Error {
  nodes: $ReadOnlyArray<$FlowFixMe>;
  constructor(
    hasteModuleName: string,
    astNodeOrNodes: $FlowFixMe,
    message: string,
  ) {
    super(`Module ${hasteModuleName}: ${message}`);

    this.nodes = Array.isArray(astNodeOrNodes)
      ? astNodeOrNodes
      : [astNodeOrNodes];

    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name;

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  ParserError,
};
