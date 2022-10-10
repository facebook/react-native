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

import type {ParserType} from './errors';
const {MisnamedModuleInterfaceParserError} = require('./errors.js');

export function throwIfModuleInterfaceIsMisnamed(
  nativeModuleName: string,
  moduleSpecId: $FlowFixMe,
  parserType: ParserType,
) {
  if (moduleSpecId.name !== 'Spec') {
    throw new MisnamedModuleInterfaceParserError(
      nativeModuleName,
      moduleSpecId,
      parserType,
    );
  }
}
