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
  SchemaType,
  FunctionTypeAnnotationParam,
  FunctionTypeAnnotationReturn,
  ObjectParamTypeAnnotation,
} from '../../CodegenSchema';

const {
  translateObjectsForStructs,
  capitalizeFirstLetter,
} = require('./ObjCppUtils/GenerateStructs');

type FilesOutput = Map<string, string>;

const moduleTemplate = `
class JSI_EXPORT Native::_MODULE_NAME_::SpecJSI : public ObjCTurboModule {
public:
  Native::_MODULE_NAME_::SpecJSI(id<RCTTurboModule> instance, std::shared_ptr<JSCallInvoker> jsInvoker);
};`;

const protocolTemplate = `
::_STRUCTS_::

@protocol Native::_MODULE_NAME_::Spec <RCTBridgeModule, RCTTurboModule>
::_MODULE_PROPERTIES_::
@end
`;

const callbackArgs = prop =>
  prop.typeAnnotation.returnTypeAnnotation.type ===
  'GenericPromiseTypeAnnotation'
    ? `${
        prop.typeAnnotation.params.length === 0 ? '' : '\n   resolve'
      }:(RCTPromiseResolveBlock)resolve
   reject:(RCTPromiseRejectBlock)reject`
    : '';

const template = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// NOTE: This entire file should be codegen'ed.

#import <vector>

#import <Foundation/Foundation.h>

#import <React/RCTBridgeModule.h>

#import <ReactCommon/RCTTurboModule.h>
#import <RCTRequired/RCTRequired.h>
#import <RCTTypeSafety/RCTTypedModuleConstants.h>
#import <React/RCTCxxConvert.h>
#import <React/RCTManagedPointer.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>

::_PROTOCOLS_::

namespace facebook {
namespace react {
::_MODULES_::

} // namespace react
} // namespace facebook
`;

type ObjectForGeneratingStructs = $ReadOnly<{|
  name: string,
  object: $ReadOnly<{|
    type: 'ObjectTypeAnnotation',
    properties: $ReadOnlyArray<ObjectParamTypeAnnotation>,
  |}>,
|}>;

const constants = `- (facebook::react::ModuleConstants<JS::Native::_MODULE_NAME_::::Constants::Builder>)constantsToExport;
- (facebook::react::ModuleConstants<JS::Native::_MODULE_NAME_::::Constants::Builder>)getConstants;`;

function translatePrimitiveJSTypeToObjCType(
  param: FunctionTypeAnnotationParam,
  error: string,
) {
  function wrapIntoNullableIfNeeded(generatedType: string) {
    return param.nullable ? `${generatedType} _Nullable` : generatedType;
  }
  switch (param.typeAnnotation.type) {
    case 'StringTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSString *');
    case 'NumberTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
      return param.nullable ? 'NSNumber *' : 'double';
    case 'BooleanTypeAnnotation':
      return param.nullable ? 'NSNumber * _Nullable' : 'BOOL';
    case 'GenericObjectTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSDictionary *');
    case 'ArrayTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSArray *');
    case 'FunctionTypeAnnotation':
      return 'RCTResponseSenderBlock';
    case 'ObjectTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSDictionary *');
    default:
      throw new Error(error);
  }
}

function translatePrimitiveJSTypeToObjCTypeForReturn(
  type: FunctionTypeAnnotationReturn,
  error: string,
) {
  function wrapIntoNullableIfNeeded(generatedType: string) {
    return type.nullable ? `${generatedType} _Nullable` : generatedType;
  }
  switch (type.type) {
    case 'VoidTypeAnnotation':
    case 'GenericPromiseTypeAnnotation':
      return 'void';
    case 'StringTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSString *');
    case 'NumberTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
      return wrapIntoNullableIfNeeded('NSNumber *');
    case 'BooleanTypeAnnotation':
      return type.nullable ? 'NSNumber * _Nullable' : 'BOOL';
    case 'GenericObjectTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSDictionary *');
    case 'ArrayTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSArray<id<NSObject>> *');
    case 'ObjectTypeAnnotation':
      return wrapIntoNullableIfNeeded('NSDictionary *');
    default:
      throw new Error(error);
  }
}
const methodImplementationTemplate =
  '- (::_RETURN_VALUE_::) ::_PROPERTY_NAME_::::_ARGS_::;';

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    moduleSpecName: string,
  ): FilesOutput {
    const nativeModules = Object.keys(schema.modules)
      .map(moduleName => {
        const modules = schema.modules[moduleName].nativeModules;
        if (modules == null) {
          return null;
        }

        return modules;
      })
      .filter(Boolean)
      .reduce((acc, components) => Object.assign(acc, components), {});

    const modules = Object.keys(nativeModules)
      .map(name => moduleTemplate.replace(/::_MODULE_NAME_::/g, name))
      .join('\n');

    const protocols = Object.keys(nativeModules)
      .map(name => {
        const objectForGeneratingStructs: Array<ObjectForGeneratingStructs> = [];
        const {properties} = nativeModules[name];
        const implementations = properties
          .map(prop => {
            const nativeArgs = prop.typeAnnotation.params
              .map((param, i) => {
                let paramObjCType;
                if (
                  param.typeAnnotation.type === 'ObjectTypeAnnotation' &&
                  param.typeAnnotation.properties
                ) {
                  const variableName =
                    capitalizeFirstLetter(prop.name) +
                    capitalizeFirstLetter(param.name);
                  objectForGeneratingStructs.push({
                    name: variableName,
                    object: {
                      type: 'ObjectTypeAnnotation',
                      properties: param.typeAnnotation.properties,
                    },
                  });
                  paramObjCType = `JS::Native::_MODULE_NAME_::::Spec${variableName}&`;
                } else {
                  paramObjCType = translatePrimitiveJSTypeToObjCType(
                    param,
                    `Unspopported type for param "${param.name}" in ${
                      prop.name
                    }. Found: ${param.typeAnnotation.type}`,
                  );
                }
                return `${i === 0 ? '' : param.name}:(${paramObjCType})${
                  param.name
                }`;
              })
              .join('\n   ')
              .concat(callbackArgs(prop));
            const {returnTypeAnnotation} = prop.typeAnnotation;
            if (
              returnTypeAnnotation.type === 'ObjectTypeAnnotation' &&
              returnTypeAnnotation.properties
            ) {
              objectForGeneratingStructs.push({
                name: capitalizeFirstLetter(prop.name) + 'ReturnType',

                object: {
                  type: 'ObjectTypeAnnotation',
                  properties: returnTypeAnnotation.properties,
                },
              });
            }
            const implementation = methodImplementationTemplate
              .replace('::_PROPERTY_NAME_::', prop.name)
              .replace(
                '::_RETURN_VALUE_::',
                translatePrimitiveJSTypeToObjCTypeForReturn(
                  returnTypeAnnotation,
                  `Unspopported return type for ${prop.name}. Found: ${
                    prop.typeAnnotation.returnTypeAnnotation.type
                  }`,
                ),
              )
              .replace('::_ARGS_::', nativeArgs);
            if (prop.name === 'getConstants') {
              if (
                prop.typeAnnotation.returnTypeAnnotation.properties &&
                prop.typeAnnotation.returnTypeAnnotation.properties.length === 0
              ) {
                return '';
              }
              return constants.replace(/::_MODULE_NAME_::/, name);
            }
            return implementation;
          })
          .join('\n');
        return protocolTemplate
          .replace(
            /::_STRUCTS_::/g,
            translateObjectsForStructs(objectForGeneratingStructs),
          )
          .replace(/::_MODULE_PROPERTIES_::/g, implementations)
          .replace(/::_MODULE_NAME_::/g, name)
          .replace('::_PROPERTIES_MAP_::', '');
      })
      .join('\n');

    const fileName = `${moduleSpecName}.h`;
    const replacedTemplate = template
      .replace(/::_MODULES_::/g, modules)
      .replace(/::_PROTOCOLS_::/g, protocols);

    return new Map([[fileName, replacedTemplate]]);
  },
};
