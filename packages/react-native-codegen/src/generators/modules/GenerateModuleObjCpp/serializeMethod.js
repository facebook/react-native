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
  NativeModuleMethodParamSchema,
  NativeModuleReturnTypeAnnotation,
  NativeModulePropertySchema,
} from '../../../CodegenSchema';

import type {AliasResolver} from '../Utils';

const invariant = require('invariant');
const {StructCollector} = require('./StructCollector');
const {capitalize, getNamespacedStructName} = require('./Utils');

const ProtocolMethodTemplate = ({
  returnObjCType,
  methodName,
  params,
}: $ReadOnly<{|
  returnObjCType: string,
  methodName: string,
  params: string,
|}>) => `- (${returnObjCType})${methodName}${params};`;

export type StructParameterRecord = $ReadOnly<{|
  paramIndex: number,
  structName: string,
|}>;

type ReturnJSType =
  | 'VoidKind'
  | 'PromiseKind'
  | 'ObjectKind'
  | 'ArrayKind'
  | 'NumberKind'
  | 'StringKind';

export type MethodSerializationOutput = $ReadOnly<{|
  methodName: string,
  protocolMethod: string,
  selector: string,
  structParamRecords: $ReadOnlyArray<StructParameterRecord>,
  returnJSType: ReturnJSType,
  argCount: number,
|}>;

function serializeMethod(
  moduleName: string,
  property: NativeModulePropertySchema,
  structCollector: StructCollector,
  resolveAlias: AliasResolver,
): $ReadOnlyArray<MethodSerializationOutput> {
  const {
    name: methodName,
    typeAnnotation: {params, returnTypeAnnotation},
  } = property;

  if (methodName === 'getConstants') {
    return serializeConstantsProtocolMethods(
      moduleName,
      property,
      structCollector,
      resolveAlias,
    );
  }

  const methodParams: Array<{|paramName: string, objCType: string|}> = [];
  const structParamRecords: Array<StructParameterRecord> = [];

  params.forEach((param, index) => {
    const structName = getParamStructName(methodName, param);
    const {objCType, isStruct} = getParamObjCType(
      moduleName,
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

  if (returnTypeAnnotation.type === 'PromiseTypeAnnotation') {
    methodParams.push(
      {paramName: 'resolve', objCType: 'RCTPromiseResolveBlock'},
      {paramName: 'reject', objCType: 'RCTPromiseRejectBlock'},
    );
  }

  /**
   * Build Protocol Method
   **/
  const returnObjCType = getReturnObjCType(methodName, returnTypeAnnotation);
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

function getParamStructName(
  methodName: string,
  param: NativeModuleMethodParamSchema,
): string {
  if (param.typeAnnotation.type === 'TypeAliasTypeAnnotation') {
    return param.typeAnnotation.name;
  }

  return `Spec${capitalize(methodName)}${capitalize(param.name)}`;
}

function getParamObjCType(
  moduleName: string,
  methodName: string,
  param: NativeModuleMethodParamSchema,
  structName: string,
  structCollector: StructCollector,
  resolveAlias: AliasResolver,
): $ReadOnly<{|objCType: string, isStruct: boolean|}> {
  const {name: paramName, typeAnnotation} = param;
  const notRequired = param.optional || typeAnnotation.nullable;

  function wrapIntoNullableIfNeeded(generatedType: string) {
    return typeAnnotation.nullable
      ? `${generatedType} _Nullable`
      : generatedType;
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
       *   type Animal = {||};
       *   Array<Animal> => NSArray<JS::NativeSampleTurboModule::Animal *>, etc.
       */
      return notStruct(wrapIntoNullableIfNeeded('NSArray *'));
    }
  }

  const structTypeAnnotation = structCollector.process(
    structName,
    'REGULAR',
    resolveAlias,
    typeAnnotation,
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
        getNamespacedStructName(moduleName, structTypeAnnotation.name) + ' &',
      );
    }
    case 'ReservedFunctionValueTypeAnnotation':
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
  typeAnnotation: NativeModuleReturnTypeAnnotation,
) {
  function wrapIntoNullableIfNeeded(generatedType: string) {
    return typeAnnotation.nullable
      ? `${generatedType} _Nullable`
      : generatedType;
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
    case 'ReservedFunctionValueTypeAnnotation':
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
  typeAnnotation: NativeModuleReturnTypeAnnotation,
): ReturnJSType {
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
    case 'ReservedFunctionValueTypeAnnotation':
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
      return 'NumberKind';
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
  moduleName: string,
  property: NativeModulePropertySchema,
  structCollector: StructCollector,
  resolveAlias: AliasResolver,
): $ReadOnlyArray<MethodSerializationOutput> {
  if (property.typeAnnotation.params.length !== 0) {
    throw new Error(
      `${moduleName}.getConstants() may only accept 0 arguments.`,
    );
  }

  const {returnTypeAnnotation} = property.typeAnnotation;
  if (returnTypeAnnotation.type !== 'ObjectTypeAnnotation') {
    throw new Error(
      `${moduleName}.getConstants() may only return an object literal: {|...|}.`,
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

  const returnObjCType = `facebook::react::ModuleConstants<JS::Native${moduleName}::Constants::Builder>`;

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
