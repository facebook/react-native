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
  DoubleTypeAnnotation,
  Int32TypeAnnotation,
  NativeModuleNumberTypeAnnotation,
  Nullable,
  ReservedTypeAnnotation,
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

function emitNumber(
  nullable: boolean,
): Nullable<NativeModuleNumberTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'NumberTypeAnnotation',
  });
}

function emitRootTag(nullable: boolean): Nullable<ReservedTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'ReservedTypeAnnotation',
    name: 'RootTag',
  });
}

function emitDouble(nullable: boolean): Nullable<DoubleTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'DoubleTypeAnnotation',
  });
}

module.exports = {
  emitBoolean,
  emitDouble,
  emitInt32,
  emitNumber,
  emitRootTag,
};
