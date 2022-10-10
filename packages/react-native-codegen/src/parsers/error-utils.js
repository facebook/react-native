/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {ParserError} = require('./errors');

type ParserTypes = 'Flow' | 'TypeScript';

class MisnamedModuleInterfaceParserError extends ParserError {
  constructor(
    hasteModuleName: string,
    id: $FlowFixMe,
    parserType: ParserTypes,
  ) {
    super(
      hasteModuleName,
      id,
      `All ${parserType} interfaces extending TurboModule must be called 'Spec'. Please rename ${parserType} interface '${id.name}' to 'Spec'.`,
    );
  }
}
module.exports = {
  MisnamedModuleInterfaceParserError,
};
