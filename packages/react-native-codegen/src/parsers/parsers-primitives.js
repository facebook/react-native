/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

import type {
  BooleanTypeAnnotation,
  Int32TypeAnnotation,
  Nullable,
} from '../CodegenSchema';

const {wrapNullable} = require('./parsers-commons');

function emitBoolean(nullable: boolean): Nullable<BooleanTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'BooleanTypeAnnotation',
  });
}

function emitInt32(nullable: boolean): Nullable<Int32TypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'Int32TypeAnnotation',
  });
}

module.exports = {
  emitBoolean,
  emitInt32,
};
