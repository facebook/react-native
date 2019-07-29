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
  FunctionTypeAnnotationParamTypeAnnotation,
  FunctionTypeAnnotationReturn,
} from '../../CodegenSchema';

type FilesOutput = Map<string, string>;

const moduleTemplate = `
class JSI_EXPORT Native::_MODULE_NAME_::SpecJSI : public ObjCTurboModule {
public:
  Native::_MODULE_NAME_::SpecJSI(id<RCTTurboModule> instance, std::shared_ptr<JSCallInvoker> jsInvoker);
};`;

const protolocTemplate = `
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

::_PROTOCOLS_::

namespace facebook {
namespace react {
::_MODULES_::

} // namespace react
} // namespace facebook
`;

function translatePrimitiveJSTypeToObjCType(
  type:
    | FunctionTypeAnnotationParamTypeAnnotation
    | FunctionTypeAnnotationReturn,
  error: string,
) {
  switch (type.type) {
    case 'VoidTypeAnnotation':
    case 'GenericPromiseTypeAnnotation':
      return 'void';
    case 'StringTypeAnnotation':
      return 'NSString *';
    case 'NumberTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
      return 'NSNumber *';
    case 'BooleanTypeAnnotation':
      return 'BOOL';
    case 'GenericObjectTypeAnnotation':
    case 'ObjectTypeAnnotation':
      return 'NSDictionary *';
    case 'ArrayTypeAnnotation':
      return 'NSArray<id<NSObject>> *';
    case 'FunctionTypeAnnotation':
      return 'RCTResponseSenderBlock';

    default:
      throw new Error(error);
  }
}
const methodImplementationTemplate =
  '- (::_RETURN_VALUE_::) ::_PROPERTY_NAME_::::_ARGS_::;';

module.exports = {
  generate(libraryName: string, schema: SchemaType): FilesOutput {
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
        const {properties} = nativeModules[name];
        const implementations = properties
          .map(prop => {
            const nativeArgs = prop.typeAnnotation.params
              .map((param, i) => {
                const paramObjCType = translatePrimitiveJSTypeToObjCType(
                  param.typeAnnotation,
                  `Unspopported type for param "${param.name}" in ${
                    prop.name
                  }. Found: ${param.typeAnnotation.type}`,
                );
                return `${i === 0 ? '' : param.name}:(${paramObjCType})${
                  param.name
                }`;
              })
              .join('\n   ')
              .concat(callbackArgs(prop));
            const implementation = methodImplementationTemplate
              .replace('::_PROPERTY_NAME_::', prop.name)
              .replace(
                '::_RETURN_VALUE_::',
                translatePrimitiveJSTypeToObjCType(
                  prop.typeAnnotation.returnTypeAnnotation,
                  `Unspopported return type for ${prop.name}. Found: ${
                    prop.typeAnnotation.returnTypeAnnotation.type
                  }`,
                ),
              )
              .replace('::_ARGS_::', nativeArgs);
            if (prop.name === 'getConstants') {
              return (
                implementation +
                '\n' +
                implementation.replace('getConstants', 'constantsToExport')
              );
            }
            return implementation;
          })
          .join('\n');
        return protolocTemplate
          .replace(/::_MODULE_PROPERTIES_::/g, implementations)
          .replace(/::_MODULE_NAME_::/g, name)
          .replace('::_PROPERTIES_MAP_::', '');
      })
      .join('\n');

    const fileName = 'RCTNativeModules.h';
    const replacedTemplate = template
      .replace(/::_MODULES_::/g, modules)
      .replace(/::_PROTOCOLS_::/g, protocols);

    return new Map([[fileName, replacedTemplate]]);
  },
};
