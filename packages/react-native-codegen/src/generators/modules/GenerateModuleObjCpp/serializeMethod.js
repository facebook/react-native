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
  Nullable,
  NamedShape,
  NativeModuleParamTypeAnnotation,
  NativeModuleReturnTypeAnnotation,
  NativeModulePropertyShape,
} from '../../../CodegenSchema';

import type {AliasResolver} from '../Utils';

const invariant = require('invariant');
const {StructCollector} = require('./StructCollector');
const {getNamespacedStructName} = require('./Utils');
const {capitalize} = require('../../Utils');
const {
  wrapNullable,
  unwrapNullable,
} = require('../../../parsers/flow/modules/utils');

const ProtocolMethodTemplate = ({
  returnObjCType,
  methodName,
  params,
}: $ReadOnly<{
  returnObjCType: string,
  methodName: string,
  params: string,
}>) => `- (${returnObjCType})${methodName}${params};`;

export type StructParameterRecord = $ReadOnly<{
  paramIndex: number,
  structName: string,
}>;

type ReturnJSType =
  | 'VoidKind'
  | 'BooleanKind'
  | 'PromiseKind'
  | 'ObjectKind'
  | 'ArrayKind'
  | 'NumberKind'
  | 'StringKind';

export type MethodSerializationOutput = $ReadOnly<{
  methodName: string,
  protocolMethod: string,
  selector: string,
  structParamRecords: $ReadOnlyArray<StructParameterRecord>,
  returnJSType: ReturnJSType,
  argCount: number,
}>;

function serializeMethod(
  hasteModuleName: string,
  property: NativeModulePropertyShape,
  structCollector: StructCollector,
  resolveAlias: AliasResolver,
): $ReadOnlyArray<MethodSerializationOutput> {
  const {name: methodName, typeAnnotation: nullableTypeAnnotation} = property;
  const [propertyTypeAnnotation] = unwrapNullable(nullableTypeAnnotation);
  const {params} = propertyTypeAnnotation;

  if (methodName === 'getConstants') {
    return serializeConstantsProtocolMethods(
      hasteModuleName,
      property,
      structCollector,
      resolveAlias,
    );
  }

  const methodParams: Array<{paramName: string, objCType: string}> = [];
  const structParamRecords: Array<StructParameterRecord> = [];

  params.forEach((param, index) => {
    const structName = getParamStructName(methodName, param);
    const {objCType, isStruct} = getParamObjCType(
      hasteModuleName,
      methodName,
      param,
      structName,
      structCollector,
      resolveAlias,
    );

    methodParams.push({paramName: param.name, objCType});

    if (isStruct) {
      structParamRecords.push({paramIndex: index, structName});
    }
  });

  // Unwrap returnTypeAnnotation, so we check if the return type is Promise
  // TODO(T76719514): Disallow nullable PromiseTypeAnnotations
  const [returnTypeAnnotation] = unwrapNullable(
    propertyTypeAnnotation.returnTypeAnnotation,
  );

  if (returnTypeAnnotation.type === 'PromiseTypeAnnotation') {
    methodParams.push(
      {paramName: 'resolve', objCType: 'RCTPromiseResolveBlock'},
      {paramName: 'reject', objCType: 'RCTPromiseRejectBlock'},
    );
  }

  /**
   * Build Protocol Method
   **/
  const returnObjCType = getReturnObjCType(
    methodName,
    propertyTypeAnnotation.returnTypeAnnotation,
  );
  const paddingMax = `- (${returnObjCType})${methodName}`.length;

  const objCParams = methodParams.reduce(
    ($objCParams, {objCType, paramName}, i) => {
      const rhs = `(${objCType})${paramName}`;
      const padding = ' '.repeat(Math.max(0, paddingMax - paramName.length));
      return i === 0
        ? `:${rhs}`
        : `${$objCParams}\n${padding}${paramName}:${rhs}`;
    },
    '',
  );

  const protocolMethod = ProtocolMethodTemplate({
    methodName,
    returnObjCType,
    params: objCParams,
  });

  /**
   * Build ObjC Selector
   */
  const selector = methodParams
    .map<string>(({paramName}) => paramName)
    .reduce(($selector, paramName, i) => {
      return i === 0 ? `${$selector}:` : `${$selector}${paramName}:`;
    }, methodName);

  /**
   * Build JS Return type
   */
  const returnJSType = getReturnJSType(methodName, returnTypeAnnotation);

  return [
    {
      methodName,
      protocolMethod,
      selector: `@selector(${selector})`,
      structParamRecords,
      returnJSType,
      argCount: params.length,
    },
  ];
}

type Param = NamedShape<Nullable<NativeModuleParamTypeAnnotation>>;

function getParamStructName(methodName: string, param: Param): string {
  const [typeAnnotation] = unwrapNullable(param.typeAnnotation);
  if (typeAnnotation.type === 'TypeAliasTypeAnnotation') {
    return typeAnnotation.name;
  }

  return `Spec${capitalize(methodName)}${capitalize(param.name)}`;
}

function getParamObjCType(
  hasteModuleName: string,
  methodName: string,
  param: Param,
  structName: string,
  structCollector: StructCollector,
  resolveAlias: AliasResolver,
): $ReadOnly<{objCType: string, isStruct: boolean}> {
  const {name: paramName, typeAnnotation: nullableTypeAnnotation} = param;
  const [typeAnnotation, nullable] = unwrapNullable(nullableTypeAnnotation);
  const notRequired = param.optional || nullable;

  function wrapIntoNullableIfNeeded(generatedType: string) {
    return nullable ? `${generatedType} _Nullable` : generatedType;
  }

  const isStruct = (objCType: string) => ({
    isStruct: true,
    objCType,
  });

  const notStruct = (objCType: string) => ({
    isStruct: false,
    objCType,
  });

  // Handle types that can only be in parameters
  switch (typeAnnotation.type) {
    case 'FunctionTypeAnnotation': {
      return notStruct('RCTResponseSenderBlock');
    }
    case 'ArrayTypeAnnotation': {
      /**
       * Array in params always codegen NSArray *
       *
       * TODO(T73933406): Support codegen for Arrays of structs and primitives
       *
       * For example:
       *   Array<number> => NSArray<NSNumber *>
       *   type Animal = {};
       *   Array<Animal> => NSArray<JS::NativeSampleTurboModule::Animal *>, etc.
       */
      return notStruct(wrapIntoNullableIfNeeded('NSArray *'));
    }
  }

  const [structTypeAnnotation] = unwrapNullable(
    structCollector.process(
      structName,
      'REGULAR',
      resolveAlias,
      wrapNullable(nullable, typeAnnotation),
    ),
  );

  invariant(
    structTypeAnnotation.type !== 'ArrayTypeAnnotation',
    'ArrayTypeAnnotations should have been processed earlier',
  );

  switch (structTypeAnnotation.type) {
    case 'TypeAliasTypeAnnotation': {
      /**
       * TODO(T73943261): Support nullable object literals and aliases?
       */
      return isStruct(
        getNamespacedStructName(hasteModuleName, structTypeAnnotation.name) +
          ' &',
      );
    }
    case 'ReservedTypeAnnotation':
      switch (structTypeAnnotation.name) {
        case 'RootTag':
          return notStruct(notRequired ? 'NSNumber *' : 'double');
        default:
          (structTypeAnnotation.name: empty);
          throw new Error(
            `Unsupported type for param "${paramName}" in ${methodName}. Found: ${structTypeAnnotation.type}`,
          );
      }
    case 'StringTypeAnnotation':
      return notStruct(wrapIntoNullableIfNeeded('NSString *'));
    case 'NumberTypeAnnotation':
      return notStruct(notRequired ? 'NSNumber *' : 'double');
    case 'FloatTypeAnnotation':
      return notStruct(notRequired ? 'NSNumber *' : 'double');
    case 'DoubleTypeAnnotation':
      return notStruct(notRequired ? 'NSNumber *' : 'double');
    case 'Int32TypeAnnotation':
      return notStruct(notRequired ? 'NSNumber *' : 'double');
    case 'BooleanTypeAnnotation':
      return notStruct(notRequired ? 'NSNumber *' : 'BOOL');
    case 'GenericObjectTypeAnnotation':
      return notStruct(wrapIntoNullableIfNeeded('NSDictionary *'));
    default:
      (structTypeAnnotation.type: empty);
      throw new Error(
        `Unsupported type for param "${paramName}" in ${methodName}. Found: ${typeAnnotation.type}`,
      );
  }
}

function getReturnObjCType(
  methodName: string,
  nullableTypeAnnotation: Nullable<NativeModuleReturnTypeAnnotation>,
) {
  const [typeAnnotation, nullable] = unwrapNullable(nullableTypeAnnotation);

  function wrapIntoNullableIfNeeded(generatedType: string) {
    return nullable ? `${generatedType} _Nullable` : generatedType;
  }

  switch (typeAnnotation.type) {
    case 'VoidTypeAnnotation':
      return 'void';
    case 'PromiseTypeAnnotation':
      return 'void';
    case 'ObjectTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSDictionary *');
    case 'TypeAliasTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSDictionary *');
    case 'ArrayTypeAnnotation':
      if (typeAnnotation.elementType == null) {
        return wrapIntoNullableIfNeeded('NSArray<id<NSObject>> *');
      }

      return wrapIntoNullableIfNeeded(
        `NSArray<${getReturnObjCType(
          methodName,
          typeAnnotation.elementType,
        )}> *`,
      );
    case 'ReservedTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'RootTag':
          return wrapIntoNullableIfNeeded('NSNumber *');
        default:
          (typeAnnotation.name: empty);
          throw new Error(
            `Unsupported return type for ${methodName}. Found: ${typeAnnotation.name}`,
          );
      }
    case 'StringTypeAnnotation':
      // TODO: Can NSString * returns not be _Nullable?
      // In the legacy codegen, we don't surround NSSTring * with _Nullable
      return wrapIntoNullableIfNeeded('NSString *');
    case 'NumberTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSNumber *');
    case 'FloatTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSNumber *');
    case 'DoubleTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSNumber *');
    case 'Int32TypeAnnotation':
      return wrapIntoNullableIfNeeded('NSNumber *');
    case 'BooleanTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSNumber *');
    case 'GenericObjectTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSDictionary *');
    default:
      (typeAnnotation.type: empty);
      throw new Error(
        `Unsupported return type for ${methodName}. Found: ${typeAnnotation.type}`,
      );
  }
}

function getReturnJSType(
  methodName: string,
  nullableTypeAnnotation: Nullable<NativeModuleReturnTypeAnnotation>,
): ReturnJSType {
  const [typeAnnotation] = unwrapNullable(nullableTypeAnnotation);
  switch (typeAnnotation.type) {
    case 'VoidTypeAnnotation':
      return 'VoidKind';
    case 'PromiseTypeAnnotation':
      return 'PromiseKind';
    case 'ObjectTypeAnnotation':
      return 'ObjectKind';
    case 'TypeAliasTypeAnnotation':
      return 'ObjectKind';
    case 'ArrayTypeAnnotation':
      return 'ArrayKind';
    case 'ReservedTypeAnnotation':
      return 'NumberKind';
    case 'StringTypeAnnotation':
      return 'StringKind';
    case 'NumberTypeAnnotation':
      return 'NumberKind';
    case 'FloatTypeAnnotation':
      return 'NumberKind';
    case 'DoubleTypeAnnotation':
      return 'NumberKind';
    case 'Int32TypeAnnotation':
      return 'NumberKind';
    case 'BooleanTypeAnnotation':
      return 'BooleanKind';
    case 'GenericObjectTypeAnnotation':
      return 'ObjectKind';
    default:
      (typeAnnotation.type: empty);
      throw new Error(
        `Unsupported return type for ${methodName}. Found: ${typeAnnotation.type}`,
      );
  }
}

function serializeConstantsProtocolMethods(
  hasteModuleName: string,
  property: NativeModulePropertyShape,
  structCollector: StructCollector,
  resolveAlias: AliasResolver,
): $ReadOnlyArray<MethodSerializationOutput> {
  const [propertyTypeAnnotation] = unwrapNullable(property.typeAnnotation);
  if (propertyTypeAnnotation.params.length !== 0) {
    throw new Error(
      `${hasteModuleName}.getConstants() may only accept 0 arguments.`,
    );
  }

  const {returnTypeAnnotation} = propertyTypeAnnotation;
  if (returnTypeAnnotation.type !== 'ObjectTypeAnnotation') {
    throw new Error(
      `${hasteModuleName}.getConstants() may only return an object literal: {...}.`,
    );
  }

  if (returnTypeAnnotation.properties.length === 0) {
    return [];
  }

  const realTypeAnnotation = structCollector.process(
    'Constants',
    'CONSTANTS',
    resolveAlias,
    returnTypeAnnotation,
  );

  invariant(
    realTypeAnnotation.type === 'TypeAliasTypeAnnotation',
    "Unable to generate C++ struct from module's getConstants() method return type.",
  );

  const returnObjCType = `facebook::react::ModuleConstants<JS::${hasteModuleName}::Constants::Builder>`;

  return ['constantsToExport', 'getConstants'].map<MethodSerializationOutput>(
    methodName => {
      const protocolMethod = ProtocolMethodTemplate({
        methodName,
        returnObjCType,
        params: '',
      });

      return {
        methodName,
        protocolMethod,
        returnJSType: 'ObjectKind',
        selector: `@selector(${methodName})`,
        structParamRecords: [],
        argCount: 0,
      };
    },
  );
}

module.exports = {
  serializeMethod,
};
