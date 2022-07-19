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

const {getSafePropertyName, getNamespacedStructName} = require('../Utils');
const {capitalize} = require('../../../Utils');

import type {Nullable} from '../../../../CodegenSchema';
import type {StructTypeAnnotation, ConstantsStruct} from '../StructCollector';
import type {StructSerilizationOutput} from './serializeStruct';

const {unwrapNullable} = require('../../../../parsers/flow/modules/utils');

const StructTemplate = ({
  hasteModuleName,
  structName,
  builderInputProps,
}: $ReadOnly<{
  hasteModuleName: string,
  structName: string,
  builderInputProps: string,
}>) => `namespace JS {
  namespace ${hasteModuleName} {
    struct ${structName} {

      struct Builder {
        struct Input {
          ${builderInputProps}
        };

        /** Initialize with a set of values */
        Builder(const Input i);
        /** Initialize with an existing ${structName} */
        Builder(${structName} i);
        /** Builds the object. Generally used only by the infrastructure. */
        NSDictionary *buildUnsafeRawValue() const { return _factory(); };
      private:
        NSDictionary *(^_factory)(void);
      };

      static ${structName} fromUnsafeRawValue(NSDictionary *const v) { return {v}; }
      NSDictionary *unsafeRawValue() const { return _v; }
    private:
      ${structName}(NSDictionary *const v) : _v(v) {}
      NSDictionary *_v;
    };
  }
}`;

const MethodTemplate = ({
  hasteModuleName,
  structName,
  properties,
}: $ReadOnly<{
  hasteModuleName: string,
  structName: string,
  properties: string,
}>) => `inline JS::${hasteModuleName}::${structName}::Builder::Builder(const Input i) : _factory(^{
  NSMutableDictionary *d = [NSMutableDictionary new];
${properties}
  return d;
}) {}
inline JS::${hasteModuleName}::${structName}::Builder::Builder(${structName} i) : _factory(^{
  return i.unsafeRawValue();
}) {}`;

function toObjCType(
  hasteModuleName: string,
  nullableTypeAnnotation: Nullable<StructTypeAnnotation>,
  isOptional: boolean = false,
): string {
  const [typeAnnotation, nullable] = unwrapNullable(nullableTypeAnnotation);
  const isRequired = !nullable && !isOptional;
  const wrapOptional = (type: string) => {
    return isRequired ? type : `std::optional<${type}>`;
  };

  switch (typeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'RootTag':
          return wrapOptional('double');
        default:
          (typeAnnotation.name: empty);
          throw new Error(`Unknown prop type, found: ${typeAnnotation.name}"`);
      }
    case 'StringTypeAnnotation':
      return 'NSString *';
    case 'NumberTypeAnnotation':
      return wrapOptional('double');
    case 'FloatTypeAnnotation':
      return wrapOptional('double');
    case 'Int32TypeAnnotation':
      return wrapOptional('double');
    case 'DoubleTypeAnnotation':
      return wrapOptional('double');
    case 'BooleanTypeAnnotation':
      return wrapOptional('bool');
    case 'GenericObjectTypeAnnotation':
      return isRequired ? 'id<NSObject> ' : 'id<NSObject> _Nullable ';
    case 'ArrayTypeAnnotation':
      if (typeAnnotation.elementType == null) {
        return isRequired ? 'id<NSObject> ' : 'id<NSObject> _Nullable ';
      }

      return wrapOptional(
        `std::vector<${toObjCType(
          hasteModuleName,
          typeAnnotation.elementType,
        )}>`,
      );
    case 'TypeAliasTypeAnnotation':
      const structName = capitalize(typeAnnotation.name);
      const namespacedStructName = getNamespacedStructName(
        hasteModuleName,
        structName,
      );
      return wrapOptional(`${namespacedStructName}::Builder`);
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

  function wrapPrimitive(type: string) {
    return !isRequired
      ? `${value}.has_value() ? @((${type})${value}.value()) : nil`
      : `@(${value})`;
  }

  switch (typeAnnotation.type) {
    case 'ReservedTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'RootTag':
          return wrapPrimitive('double');
        default:
          (typeAnnotation.name: empty);
          throw new Error(
            `Couldn't convert into ObjC type: ${typeAnnotation.type}"`,
          );
      }
    case 'StringTypeAnnotation':
      return value;
    case 'NumberTypeAnnotation':
      return wrapPrimitive('double');
    case 'FloatTypeAnnotation':
      return wrapPrimitive('double');
    case 'Int32TypeAnnotation':
      return wrapPrimitive('double');
    case 'DoubleTypeAnnotation':
      return wrapPrimitive('double');
    case 'BooleanTypeAnnotation':
      return wrapPrimitive('BOOL');
    case 'GenericObjectTypeAnnotation':
      return value;
    case 'ArrayTypeAnnotation':
      const {elementType} = typeAnnotation;
      if (elementType == null) {
        return value;
      }

      const localVarName = `el${'_'.repeat(depth + 1)}`;
      const elementObjCType = toObjCType(hasteModuleName, elementType);
      const elementObjCValue = toObjCValue(
        hasteModuleName,
        elementType,
        localVarName,
        depth + 1,
      );

      const RCTConvertVecToArray = (transformer: string) => {
        return `RCTConvert${
          !isRequired ? 'Optional' : ''
        }VecToArray(${value}, ${transformer})`;
      };

      return RCTConvertVecToArray(
        `^id(${elementObjCType} ${localVarName}) { return ${elementObjCValue}; }`,
      );
    case 'TypeAliasTypeAnnotation':
      return !isRequired
        ? `${value}.has_value() ? ${value}.value().buildUnsafeRawValue() : nil`
        : `${value}.buildUnsafeRawValue()`;
    default:
      (typeAnnotation.type: empty);
      throw new Error(
        `Couldn't convert into ObjC value: ${typeAnnotation.type}"`,
      );
  }
}

function serializeConstantsStruct(
  hasteModuleName: string,
  struct: ConstantsStruct,
): StructSerilizationOutput {
  const declaration = StructTemplate({
    hasteModuleName,
    structName: struct.name,
    builderInputProps: struct.properties
      .map(property => {
        const {typeAnnotation, optional} = property;
        const safePropName = getSafePropertyName(property);
        const objCType = toObjCType(hasteModuleName, typeAnnotation, optional);

        if (!optional) {
          return `RCTRequired<${objCType}> ${safePropName};`;
        }

        const space = ' '.repeat(objCType.endsWith('*') ? 0 : 1);
        return `${objCType}${space}${safePropName};`;
      })
      .join('\n          '),
  });

  const methods = MethodTemplate({
    hasteModuleName,
    structName: struct.name,
    properties: struct.properties
      .map(property => {
        const {typeAnnotation, optional, name: propName} = property;
        const safePropName = getSafePropertyName(property);
        const objCValue = toObjCValue(
          hasteModuleName,
          typeAnnotation,
          safePropName,
          0,
          optional,
        );

        let varDecl = `auto ${safePropName} = i.${safePropName}`;
        if (!optional) {
          varDecl += '.get()';
        }

        const assignment = `d[@"${propName}"] = ` + objCValue;
        return `  ${varDecl};\n  ${assignment};`;
      })
      .join('\n'),
  });

  return {declaration, methods};
}

module.exports = {
  serializeConstantsStruct,
};
