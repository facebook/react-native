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

import type {Nullable} from '../../../../CodegenSchema';
import type {RegularStruct, StructTypeAnnotation} from '../StructCollector';
import type {StructSerilizationOutput} from './serializeStruct';

const {unwrapNullable} = require('../../../../parsers/parsers-commons');
const {wrapOptional: wrapCxxOptional} = require('../../../TypeUtils/Cxx');
const {
  wrapOptional: wrapObjCOptional,
} = require('../../../TypeUtils/Objective-C');
const {capitalize} = require('../../../Utils');
const {getNamespacedStructName, getSafePropertyName} = require('../Utils');

const StructTemplate = ({
  hasteModuleName,
  structName,
  structProperties,
}: $ReadOnly<{
  hasteModuleName: string,
  structName: string,
  structProperties: string,
}>) => `namespace JS {
  namespace ${hasteModuleName} {
    struct ${structName} {
      ${structProperties}

      ${structName}(NSDictionary *const v) : _v(v) {}
    private:
      NSDictionary *_v;
    };
  }
}

@interface RCTCxxConvert (${hasteModuleName}_${structName})
+ (RCTManagedPointer *)JS_${hasteModuleName}_${structName}:(id)json;
@end`;

const MethodTemplate = ({
  returnType,
  returnValue,
  hasteModuleName,
  structName,
  propertyName,
  safePropertyName,
}: $ReadOnly<{
  returnType: string,
  returnValue: string,
  hasteModuleName: string,
  structName: string,
  propertyName: string,
  safePropertyName: string,
}>) => `inline ${returnType}JS::${hasteModuleName}::${structName}::${safePropertyName}() const
{
  id const p = _v[@"${propertyName}"];
  return ${returnValue};
}`;

function toObjCType(
  hasteModuleName: string,
  nullableTypeAnnotation: Nullable<StructTypeAnnotation>,
  isOptional: boolean = false,
): string {
  const [typeAnnotation, nullable] = unwrapNullable(nullableTypeAnnotation);
  const isRequired = !nullable && !isOptional;

  switch (typeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'RootTag':
          return wrapCxxOptional('double', isRequired);
        default:
          (typeAnnotation.name: empty);
          throw new Error(`Unknown prop type, found: ${typeAnnotation.name}"`);
      }
    case 'StringTypeAnnotation':
      return 'NSString *';
    case 'NumberTypeAnnotation':
      return wrapCxxOptional('double', isRequired);
    case 'FloatTypeAnnotation':
      return wrapCxxOptional('double', isRequired);
    case 'Int32TypeAnnotation':
      return wrapCxxOptional('double', isRequired);
    case 'DoubleTypeAnnotation':
      return wrapCxxOptional('double', isRequired);
    case 'BooleanTypeAnnotation':
      return wrapCxxOptional('bool', isRequired);
    case 'EnumDeclaration':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return wrapCxxOptional('double', isRequired);
        case 'StringTypeAnnotation':
          return 'NSString *';
        default:
          throw new Error(
            `Couldn't convert enum into ObjC type: ${typeAnnotation.type}"`,
          );
      }
    case 'GenericObjectTypeAnnotation':
      return wrapObjCOptional('id<NSObject>', isRequired);
    case 'ArrayTypeAnnotation':
      if (typeAnnotation.elementType.type === 'AnyTypeAnnotation') {
        return wrapObjCOptional('id<NSObject>', isRequired);
      }
      return wrapCxxOptional(
        `facebook::react::LazyVector<${toObjCType(
          hasteModuleName,
          typeAnnotation.elementType,
        )}>`,
        isRequired,
      );
    case 'TypeAliasTypeAnnotation':
      const structName = capitalize(typeAnnotation.name);
      const namespacedStructName = getNamespacedStructName(
        hasteModuleName,
        structName,
      );
      return wrapCxxOptional(namespacedStructName, isRequired);
    default:
      (typeAnnotation.type: empty);
      throw new Error(
        `Couldn't convert into ObjC type: ${typeAnnotation.type}"`,
      );
  }
}

function toObjCValue(
  hasteModuleName: string,
  nullableTypeAnnotation: Nullable<StructTypeAnnotation>,
  value: string,
  depth: number,
  isOptional: boolean = false,
): string {
  const [typeAnnotation, nullable] = unwrapNullable(nullableTypeAnnotation);
  const isRequired = !nullable && !isOptional;
  const RCTBridgingTo = (type: string, arg?: string) => {
    const args = [value, arg].filter(Boolean).join(', ');
    return isRequired
      ? `RCTBridgingTo${type}(${args})`
      : `RCTBridgingToOptional${type}(${args})`;
  };

  switch (typeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'RootTag':
          return RCTBridgingTo('Double');
        default:
          (typeAnnotation.name: empty);
          throw new Error(
            `Couldn't convert into ObjC type: ${typeAnnotation.type}"`,
          );
      }
    case 'StringTypeAnnotation':
      return RCTBridgingTo('String');
    case 'NumberTypeAnnotation':
      return RCTBridgingTo('Double');
    case 'FloatTypeAnnotation':
      return RCTBridgingTo('Double');
    case 'Int32TypeAnnotation':
      return RCTBridgingTo('Double');
    case 'DoubleTypeAnnotation':
      return RCTBridgingTo('Double');
    case 'BooleanTypeAnnotation':
      return RCTBridgingTo('Bool');
    case 'EnumDeclaration':
      switch (typeAnnotation.memberType) {
        case 'NumberTypeAnnotation':
          return RCTBridgingTo('Double');
        case 'StringTypeAnnotation':
          return RCTBridgingTo('String');
        default:
          throw new Error(
            `Couldn't convert enum into ObjC value: ${typeAnnotation.type}"`,
          );
      }
    case 'GenericObjectTypeAnnotation':
      return value;
    case 'ArrayTypeAnnotation':
      const {elementType} = typeAnnotation;
      if (elementType.type === 'AnyTypeAnnotation') {
        return value;
      }

      const localVarName = `itemValue_${depth}`;
      const elementObjCType = toObjCType(hasteModuleName, elementType);
      const elementObjCValue = toObjCValue(
        hasteModuleName,
        elementType,
        localVarName,
        depth + 1,
      );

      return RCTBridgingTo(
        'Vec',
        `^${elementObjCType}(id ${localVarName}) { return ${elementObjCValue}; }`,
      );
    case 'TypeAliasTypeAnnotation':
      const structName = capitalize(typeAnnotation.name);
      const namespacedStructName = getNamespacedStructName(
        hasteModuleName,
        structName,
      );

      return !isRequired
        ? `(${value} == nil ? std::nullopt : std::make_optional(${namespacedStructName}(${value})))`
        : `${namespacedStructName}(${value})`;
    default:
      (typeAnnotation.type: empty);
      throw new Error(
        `Couldn't convert into ObjC value: ${typeAnnotation.type}"`,
      );
  }
}

function serializeRegularStruct(
  hasteModuleName: string,
  struct: RegularStruct,
): StructSerilizationOutput {
  const declaration = StructTemplate({
    hasteModuleName: hasteModuleName,
    structName: struct.name,
    structProperties: struct.properties
      .map(property => {
        const {typeAnnotation, optional} = property;
        const safePropName = getSafePropertyName(property);
        const returnType = toObjCType(
          hasteModuleName,
          typeAnnotation,
          optional,
        );

        const padding = ' '.repeat(returnType.endsWith('*') ? 0 : 1);
        return `${returnType}${padding}${safePropName}() const;`;
      })
      .join('\n      '),
  });

  // $FlowFixMe[missing-type-arg]
  const methods = struct.properties
    .map<string>(property => {
      const {typeAnnotation, optional, name: propName} = property;
      const safePropertyName = getSafePropertyName(property);
      const returnType = toObjCType(hasteModuleName, typeAnnotation, optional);
      const returnValue = toObjCValue(
        hasteModuleName,
        typeAnnotation,
        'p',
        0,
        optional,
      );

      const padding = ' '.repeat(returnType.endsWith('*') ? 0 : 1);
      return MethodTemplate({
        hasteModuleName,
        structName: struct.name,
        returnType: returnType + padding,
        returnValue: returnValue,
        propertyName: propName,
        safePropertyName,
      });
    })
    .join('\n');

  return {methods, declaration};
}

module.exports = {
  serializeRegularStruct,
};
