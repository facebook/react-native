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

const {
  capitalize,
  getSafePropertyName,
  getNamespacedStructName,
} = require('../Utils');

import type {StructTypeAnnotation, ConstantsStruct} from '../StructCollector';
import type {StructSerilizationOutput} from './serializeStruct';

const StructTemplate = ({
  moduleName,
  structName,
  builderInputProps,
}: $ReadOnly<{|
  moduleName: string,
  structName: string,
  builderInputProps: string,
|}>) => `
namespace JS {
  namespace Native${moduleName} {
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
  moduleName,
  structName,
  properties,
}: $ReadOnly<{|
  moduleName: string,
  structName: string,
  properties: string,
|}>) => `
inline JS::Native${moduleName}::${structName}::Builder::Builder(const Input i) : _factory(^{
  NSMutableDictionary *d = [NSMutableDictionary new];
${properties}
  return d;
}) {}
inline JS::Native${moduleName}::${structName}::Builder::Builder(${structName} i) : _factory(^{
  return i.unsafeRawValue();
}) {}`;

function toObjCType(
  moduleName: string,
  typeAnnotation: StructTypeAnnotation,
  isOptional: boolean = false,
): string {
  const isRequired = !typeAnnotation.nullable && !isOptional;
  const wrapFollyOptional = (type: string) => {
    return isRequired ? type : `folly::Optional<${type}>`;
  };

  switch (typeAnnotation.type) {
    case 'ReservedFunctionValueTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'RootTag':
          return wrapFollyOptional('double');
        default:
          (typeAnnotation.name: empty);
          throw new Error(`Unknown prop type, found: ${typeAnnotation.name}"`);
      }
    case 'StringTypeAnnotation':
      return 'NSString *';
    case 'NumberTypeAnnotation':
      return wrapFollyOptional('double');
    case 'FloatTypeAnnotation':
      return wrapFollyOptional('double');
    case 'Int32TypeAnnotation':
      return wrapFollyOptional('double');
    case 'DoubleTypeAnnotation':
      return wrapFollyOptional('double');
    case 'BooleanTypeAnnotation':
      return wrapFollyOptional('bool');
    case 'GenericObjectTypeAnnotation':
      return isRequired ? 'id<NSObject> ' : 'id<NSObject> _Nullable ';
    case 'ArrayTypeAnnotation':
      if (typeAnnotation.elementType == null) {
        return isRequired ? 'id<NSObject> ' : 'id<NSObject> _Nullable ';
      }

      return wrapFollyOptional(
        `std::vector<${toObjCType(moduleName, typeAnnotation.elementType)}>`,
      );
    case 'TypeAliasTypeAnnotation':
      const structName = capitalize(typeAnnotation.name);
      const namespacedStructName = getNamespacedStructName(
        moduleName,
        structName,
      );
      return wrapFollyOptional(`${namespacedStructName}::Builder`);
    default:
      (typeAnnotation.type: empty);
      throw new Error(
        `Couldn't convert into ObjC type: ${typeAnnotation.type}"`,
      );
  }
}

function toObjCValue(
  moduleName: string,
  typeAnnotation: StructTypeAnnotation,
  value: string,
  depth: number,
  isOptional: boolean = false,
): string {
  const isRequired = !isOptional && !typeAnnotation.nullable;

  function wrapPrimitive(type: string) {
    return !isRequired
      ? `${value}.hasValue() ? @((${type})${value}.value()) : nil`
      : `@(${value})`;
  }

  switch (typeAnnotation.type) {
    case 'ReservedFunctionValueTypeAnnotation':
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
      const elementObjCType = toObjCType(moduleName, elementType);
      const elementObjCValue = toObjCValue(
        moduleName,
        elementType,
        localVarName,
        depth + 1,
      );

      const RCTConvertVecToArray = transformer => {
        return `RCTConvert${
          !isRequired ? 'Optional' : ''
        }VecToArray(${value}, ${transformer})`;
      };

      return RCTConvertVecToArray(
        `^id(${elementObjCType} ${localVarName}) { return ${elementObjCValue}; }`,
      );
    case 'TypeAliasTypeAnnotation':
      return !isRequired
        ? `${value}.hasValue() ? ${value}.value().buildUnsafeRawValue() : nil`
        : `${value}.buildUnsafeRawValue()`;
    default:
      (typeAnnotation.type: empty);
      throw new Error(
        `Couldn't convert into ObjC value: ${typeAnnotation.type}"`,
      );
  }
}

function serializeConstantsStruct(
  moduleName: string,
  struct: ConstantsStruct,
): StructSerilizationOutput {
  const declaration = StructTemplate({
    moduleName,
    structName: struct.name,
    builderInputProps: struct.properties
      .map(property => {
        const {typeAnnotation, optional} = property;
        const propName = getSafePropertyName(property);
        const objCType = toObjCType(moduleName, typeAnnotation, optional);

        if (!optional) {
          return `RCTRequired<${objCType}> ${propName};`;
        }

        const space = ' '.repeat(objCType.endsWith('*') ? 0 : 1);
        return `${objCType}${space}${propName};`;
      })
      .join('\n          '),
  });

  const methods = MethodTemplate({
    moduleName,
    structName: struct.name,
    properties: struct.properties
      .map(property => {
        const {typeAnnotation, optional} = property;
        const propName = getSafePropertyName(property);
        const objCValue = toObjCValue(
          moduleName,
          typeAnnotation,
          propName,
          0,
          optional,
        );

        let varDecl = `auto ${propName} = i.${propName}`;
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
