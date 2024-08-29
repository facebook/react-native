/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {
  NativeModuleArrayTypeAnnotation,
  NativeModuleBaseTypeAnnotation,
  BooleanTypeAnnotation,
  DoubleTypeAnnotation,
  NativeModuleEnumDeclaration,
  FloatTypeAnnotation,
  NativeModuleGenericObjectTypeAnnotation,
  Int32TypeAnnotation,
  NativeModuleNumberTypeAnnotation,
  NativeModuleObjectTypeAnnotation,
  StringTypeAnnotation,
  NativeModuleTypeAliasTypeAnnotation,
  Nullable,
  ReservedTypeAnnotation,
} from '../../../CodegenSchema';
import type {AliasResolver} from '../Utils';

const {
  unwrapNullable,
  wrapNullable,
} = require('../../../parsers/parsers-commons');
const {capitalize} = require('../../Utils');

type StructContext = 'CONSTANTS' | 'REGULAR';

export type RegularStruct = $ReadOnly<{
  context: 'REGULAR',
  name: string,
  properties: $ReadOnlyArray<StructProperty>,
}>;

export type ConstantsStruct = $ReadOnly<{
  context: 'CONSTANTS',
  name: string,
  properties: $ReadOnlyArray<StructProperty>,
}>;

export type Struct = RegularStruct | ConstantsStruct;

export type StructProperty = $ReadOnly<{
  name: string,
  optional: boolean,
  typeAnnotation: Nullable<StructTypeAnnotation>,
}>;

export type StructTypeAnnotation =
  | StringTypeAnnotation
  | NativeModuleNumberTypeAnnotation
  | Int32TypeAnnotation
  | DoubleTypeAnnotation
  | FloatTypeAnnotation
  | BooleanTypeAnnotation
  | NativeModuleEnumDeclaration
  | NativeModuleGenericObjectTypeAnnotation
  | ReservedTypeAnnotation
  | NativeModuleTypeAliasTypeAnnotation
  | NativeModuleArrayTypeAnnotation<Nullable<StructTypeAnnotation>>;

class StructCollector {
  _structs: Map<string, Struct> = new Map();

  process(
    structName: string,
    structContext: StructContext,
    resolveAlias: AliasResolver,
    nullableTypeAnnotation: Nullable<NativeModuleBaseTypeAnnotation>,
  ): Nullable<StructTypeAnnotation> {
    const [typeAnnotation, nullable] = unwrapNullable(nullableTypeAnnotation);
    switch (typeAnnotation.type) {
      case 'ObjectTypeAnnotation': {
        this._insertStruct(
          structName,
          structContext,
          resolveAlias,
          typeAnnotation,
        );
        return wrapNullable(nullable, {
          type: 'TypeAliasTypeAnnotation',
          name: structName,
        });
      }
      case 'ArrayTypeAnnotation': {
        if (typeAnnotation.elementType.type === 'AnyTypeAnnotation') {
          return wrapNullable(nullable, {
            type: 'ArrayTypeAnnotation',
            elementType: {
              type: 'AnyTypeAnnotation',
            },
          });
        }

        return wrapNullable(nullable, {
          type: 'ArrayTypeAnnotation',
          elementType: this.process(
            structName + 'Element',
            structContext,
            resolveAlias,
            typeAnnotation.elementType,
          ),
        });
      }
      case 'TypeAliasTypeAnnotation': {
        this._insertAlias(typeAnnotation.name, structContext, resolveAlias);
        return wrapNullable(nullable, typeAnnotation);
      }
      case 'EnumDeclaration':
        return wrapNullable(nullable, typeAnnotation);
      case 'MixedTypeAnnotation':
        throw new Error('Mixed types are unsupported in structs');
      case 'UnionTypeAnnotation':
        throw new Error('Union types are unsupported in structs');
      default: {
        return wrapNullable(nullable, typeAnnotation);
      }
    }
  }

  _insertAlias(
    aliasName: string,
    structContext: StructContext,
    resolveAlias: AliasResolver,
  ): void {
    const usedStruct = this._structs.get(aliasName);
    if (usedStruct == null) {
      this._insertStruct(
        aliasName,
        structContext,
        resolveAlias,
        resolveAlias(aliasName),
      );
    } else if (usedStruct.context !== structContext) {
      throw new Error(
        `Tried to use alias '${aliasName}' in a getConstants() return type and inside a regular struct.`,
      );
    }
  }

  _insertStruct(
    structName: string,
    structContext: StructContext,
    resolveAlias: AliasResolver,
    objectTypeAnnotation: NativeModuleObjectTypeAnnotation,
  ): void {
    // $FlowFixMe[missing-type-arg]
    const properties = objectTypeAnnotation.properties.map<
      $ReadOnly<{
        name: string,
        optional: boolean,
        typeAnnotation: Nullable<StructTypeAnnotation>,
      }>,
    >(property => {
      const propertyStructName = structName + capitalize(property.name);

      return {
        ...property,
        typeAnnotation: this.process(
          propertyStructName,
          structContext,
          resolveAlias,
          property.typeAnnotation,
        ),
      };
    });

    switch (structContext) {
      case 'REGULAR':
        this._structs.set(structName, {
          name: structName,
          context: 'REGULAR',
          properties: properties,
        });
        break;
      case 'CONSTANTS':
        this._structs.set(structName, {
          name: structName,
          context: 'CONSTANTS',
          properties: properties,
        });
        break;
      default:
        (structContext: empty);
        throw new Error(`Detected an invalid struct context: ${structContext}`);
    }
  }

  getAllStructs(): $ReadOnlyArray<Struct> {
    return [...this._structs.values()];
  }

  getStruct(name: string): ?Struct {
    return this._structs.get(name);
  }
}

module.exports = {
  StructCollector,
};
