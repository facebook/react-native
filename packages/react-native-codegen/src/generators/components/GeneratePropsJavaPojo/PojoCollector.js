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
  ReservedPropTypeAnnotation,
  NamedShape,
  ObjectTypeAnnotation,
  BooleanTypeAnnotation,
  StringTypeAnnotation,
  DoubleTypeAnnotation,
  FloatTypeAnnotation,
  Int32TypeAnnotation,
  PropTypeAnnotation,
} from '../../../CodegenSchema';

const {capitalize} = require('../../Utils');

export type Pojo = {
  name: string,
  namespace: string,
  properties: $ReadOnlyArray<PojoProperty>,
};

export type PojoProperty = NamedShape<PojoTypeAnnotation>;

export type PojoTypeAliasAnnotation = {
  type: 'PojoTypeAliasTypeAnnotation',
  name: string,
};

export type PojoTypeAnnotation =
  | $ReadOnly<{
      type: 'BooleanTypeAnnotation',
      default: boolean | null,
    }>
  | $ReadOnly<{
      type: 'StringTypeAnnotation',
      default: string | null,
    }>
  | $ReadOnly<{
      type: 'DoubleTypeAnnotation',
      default: number,
    }>
  | $ReadOnly<{
      type: 'FloatTypeAnnotation',
      default: number | null,
    }>
  | $ReadOnly<{
      type: 'Int32TypeAnnotation',
      default: number,
    }>
  | $ReadOnly<{
      type: 'StringEnumTypeAnnotation',
      default: string,
      options: $ReadOnlyArray<string>,
    }>
  | $ReadOnly<{
      type: 'Int32EnumTypeAnnotation',
      default: number,
      options: $ReadOnlyArray<number>,
    }>
  | ReservedPropTypeAnnotation
  | PojoTypeAliasAnnotation
  | $ReadOnly<{
      type: 'ArrayTypeAnnotation',
      elementType:
        | BooleanTypeAnnotation
        | StringTypeAnnotation
        | DoubleTypeAnnotation
        | FloatTypeAnnotation
        | Int32TypeAnnotation
        | $ReadOnly<{
            type: 'StringEnumTypeAnnotation',
            default: string,
            options: $ReadOnlyArray<string>,
          }>
        | PojoTypeAliasAnnotation
        | ReservedPropTypeAnnotation
        | $ReadOnly<{
            type: 'ArrayTypeAnnotation',
            elementType: PojoTypeAliasAnnotation,
          }>,
    }>;

class PojoCollector {
  _pojos: Map<string, Pojo> = new Map();
  process(
    namespace: string,
    pojoName: string,
    typeAnnotation: PropTypeAnnotation,
  ): PojoTypeAnnotation {
    switch (typeAnnotation.type) {
      case 'ObjectTypeAnnotation': {
        this._insertPojo(namespace, pojoName, typeAnnotation);
        return {
          type: 'PojoTypeAliasTypeAnnotation',
          name: pojoName,
        };
      }
      case 'ArrayTypeAnnotation': {
        const arrayTypeAnnotation = typeAnnotation;
        // TODO: Flow assumes elementType can be any. Fix this.
        const elementType: $PropertyType<
          typeof arrayTypeAnnotation,
          'elementType',
        > = arrayTypeAnnotation.elementType;

        const pojoElementType = (() => {
          switch (elementType.type) {
            case 'ObjectTypeAnnotation': {
              this._insertPojo(namespace, `${pojoName}Element`, elementType);
              return {
                type: 'PojoTypeAliasTypeAnnotation',
                name: `${pojoName}Element`,
              };
            }
            case 'ArrayTypeAnnotation': {
              const {elementType: objectTypeAnnotation} = elementType;
              this._insertPojo(
                namespace,
                `${pojoName}ElementElement`,
                objectTypeAnnotation,
              );
              return {
                type: 'ArrayTypeAnnotation',
                elementType: {
                  type: 'PojoTypeAliasTypeAnnotation',
                  name: `${pojoName}ElementElement`,
                },
              };
            }
            default: {
              return elementType;
            }
          }
        })();

        return {
          type: 'ArrayTypeAnnotation',
          elementType: pojoElementType,
        };
      }
      default:
        return typeAnnotation;
    }
  }

  _insertPojo(
    namespace: string,
    pojoName: string,
    objectTypeAnnotation: ObjectTypeAnnotation<PropTypeAnnotation>,
  ) {
    const properties = objectTypeAnnotation.properties.map(property => {
      const propertyPojoName = pojoName + capitalize(property.name);

      return {
        ...property,
        typeAnnotation: this.process(
          namespace,
          propertyPojoName,
          property.typeAnnotation,
        ),
      };
    });

    this._pojos.set(pojoName, {
      name: pojoName,
      namespace,
      properties,
    });
  }

  getAllPojos(): $ReadOnlyArray<Pojo> {
    return [...this._pojos.values()];
  }
}

module.exports = PojoCollector;
