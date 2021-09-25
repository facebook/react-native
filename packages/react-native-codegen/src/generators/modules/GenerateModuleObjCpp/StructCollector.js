/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {
  Required,
  NativeModuleObjectTypeAnnotation,
  NativeModuleStringTypeAnnotation,
  NativeModuleNumberTypeAnnotation,
  NativeModuleInt32TypeAnnotation,
  NativeModuleDoubleTypeAnnotation,
  NativeModuleFloatTypeAnnotation,
  NativeModuleBooleanTypeAnnotation,
  NativeModuleGenericObjectTypeAnnotation,
  NativeModuleReservedFunctionValueTypeAnnotation,
  NativeModuleTypeAliasTypeAnnotation,
  NativeModuleArrayTypeAnnotation,
  NativeModuleBaseTypeAnnotation,
} from '../../../CodegenSchema';

import type {AliasResolver} from '../Utils';

const {capitalize} = require('./Utils');

type StructContext = 'CONSTANTS' | 'REGULAR';

export type RegularStruct = $ReadOnly<{|
  context: 'REGULAR',
  name: string,
  properties: $ReadOnlyArray<StructProperty>,
|}>;

export type ConstantsStruct = $ReadOnly<{|
  context: 'CONSTANTS',
  name: string,
  properties: $ReadOnlyArray<StructProperty>,
|}>;

export type Struct = RegularStruct | ConstantsStruct;

export type StructProperty = $ReadOnly<{|
  name: string,
  optional: boolean,
  typeAnnotation: StructTypeAnnotation,
|}>;

export type StructTypeAnnotation =
  | NativeModuleStringTypeAnnotation
  | NativeModuleNumberTypeAnnotation
  | NativeModuleInt32TypeAnnotation
  | NativeModuleDoubleTypeAnnotation
  | NativeModuleFloatTypeAnnotation
  | NativeModuleBooleanTypeAnnotation
  | NativeModuleGenericObjectTypeAnnotation
  | NativeModuleReservedFunctionValueTypeAnnotation
  | NativeModuleTypeAliasTypeAnnotation
  | NativeModuleArrayTypeAnnotation<StructTypeAnnotation>;

class StructCollector {
  _structs: Map<string, Struct> = new Map();

  process(
    structName: string,
    structContext: StructContext,
    resolveAlias: AliasResolver,
    typeAnnotation: NativeModuleBaseTypeAnnotation,
  ): StructTypeAnnotation {
    switch (typeAnnotation.type) {
      case 'ObjectTypeAnnotation': {
        this._insertStruct(structName, structContext, resolveAlias, {
          ...typeAnnotation,
          // The nullability status of this struct is recorded in the type-alias we create for it below.
          nullable: false,
        });
        return {
          type: 'TypeAliasTypeAnnotation',
          name: structName,
          nullable: typeAnnotation.nullable,
        };
      }
      case 'ArrayTypeAnnotation': {
        if (typeAnnotation.elementType == null) {
          return {
            type: 'ArrayTypeAnnotation',
            nullable: typeAnnotation.nullable,
          };
        }

        return {
          type: 'ArrayTypeAnnotation',
          nullable: typeAnnotation.nullable,
          elementType: this.process(
            structName + 'Element',
            structContext,
            resolveAlias,
            typeAnnotation.elementType,
          ),
        };
      }
      case 'TypeAliasTypeAnnotation': {
        this._insertAlias(typeAnnotation.name, structContext, resolveAlias);
        return typeAnnotation;
      }
      default: {
        return typeAnnotation;
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
    objectTypeAnnotation: Required<NativeModuleObjectTypeAnnotation>,
  ): void {
    const properties = objectTypeAnnotation.properties.map(property => {
      const {typeAnnotation: propertyTypeAnnotation} = property;
      const propertyStructName = structName + capitalize(property.name);

      return {
        ...property,
        typeAnnotation: this.process(
          propertyStructName,
          structContext,
          resolveAlias,
          propertyTypeAnnotation,
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
