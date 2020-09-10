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

import type {SchemaType, NativeModuleShape} from '../../CodegenSchema';

const {capitalizeFirstLetter} = require('./ObjCppUtils/GenerateStructs');
const {flatObjects} = require('./ObjCppUtils/Utils');

type FilesOutput = Map<string, string>;

const propertyHeaderTemplate =
  'static facebook::jsi::Value __hostFunction_Native::_MODULE_NAME_::SpecJSI_::_PROPERTY_NAME_::(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {';

const propertyCastTemplate = `static_cast<ObjCTurboModule &>(turboModule)
         .invokeObjCMethod(rt, ::_KIND_::, "::_PROPERTY_NAME_::", @selector(::_PROPERTY_NAME_::::_ARGS_::), args, count);`;

const propertyTemplate = `
${propertyHeaderTemplate}
  return ${propertyCastTemplate}
}`.trim();

const proprertyDefTemplate =
  '  methodMap_["::_PROPERTY_NAME_::"] = MethodMetadata {::_ARGS_COUNT_::, __hostFunction_Native::_MODULE_NAME_::SpecJSI_::_PROPERTY_NAME_::};';

const moduleTemplate = `
::_TURBOMODULE_METHOD_INVOKERS_::

Native::_MODULE_NAME_::SpecJSI::Native::_MODULE_NAME_::SpecJSI(id<RCTTurboModule> instance, std::shared_ptr<CallInvoker> jsInvoker, std::shared_ptr<CallInvoker> nativeInvoker, id<RCTTurboModulePerformanceLogger> perfLogger)
  : ObjCTurboModule("::_MODULE_NAME_::", instance, jsInvoker, nativeInvoker, perfLogger) {
::_PROPERTIES_MAP_::::_CONVERSION_SELECTORS_::
}`.trim();

const getterTemplate = `
  @implementation RCTCxxConvert (Native::_MODULE_NAME_::_Spec::_GETTER_NAME_::)
+ (RCTManagedPointer *)JS_Native::_MODULE_NAME_::_Spec::_GETTER_NAME_:::(id)json
{
  return facebook::react::managedPointer<JS::Native::_MODULE_NAME_::::Spec::_GETTER_NAME_::>(json);
}
@end
`.trim();

const argConvertionTemplate =
  '\n  setMethodArgConversionSelector(@"::_ARG_NAME_::", ::_ARG_NUMBER_::, @"JS_Native::_MODULE_NAME_::_Spec::_SELECTOR_NAME_:::");';

const template = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <::_INCLUDE_::>
::_GETTERS_::
namespace facebook {
namespace react {

::_MODULES_::


} // namespace react
} // namespace facebook
`;

function translateReturnTypeToKind(type): string {
  switch (type) {
    case 'VoidTypeAnnotation':
      return 'VoidKind';
    case 'StringTypeAnnotation':
      return 'StringKind';
    case 'BooleanTypeAnnotation':
      return 'BooleanKind';
    case 'NumberTypeAnnotation':
    case 'DoubleTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
      return 'NumberKind';
    case 'GenericPromiseTypeAnnotation':
      return 'PromiseKind';
    case 'GenericObjectTypeAnnotation':
    case 'ObjectTypeAnnotation':
      return 'ObjectKind';
    case 'ArrayTypeAnnotation':
      return 'ArrayKind';
    default:
      (type: empty);
      throw new Error(`Unknown prop type for returning value, found: ${type}"`);
  }
}

function tranlsateMethodForImplementation(property): string {
  const numberOfParams =
    property.typeAnnotation.params.length +
    (property.typeAnnotation.returnTypeAnnotation.type ===
    'GenericPromiseTypeAnnotation'
      ? 2
      : 0);
  const translatedArguments = property.typeAnnotation.params
    .map(param => param.name)
    .concat(
      property.typeAnnotation.returnTypeAnnotation.type ===
        'GenericPromiseTypeAnnotation'
        ? ['resolve', 'reject']
        : [],
    )
    .slice(1)
    .join(':')
    .concat(':');
  if (
    property.name === 'getConstants' &&
    property.typeAnnotation.returnTypeAnnotation.type ===
      'ObjectTypeAnnotation' &&
    property.typeAnnotation.returnTypeAnnotation.properties &&
    property.typeAnnotation.returnTypeAnnotation.properties.length === 0
  ) {
    return '';
  }
  return propertyTemplate
    .replace(
      /::_KIND_::/g,
      translateReturnTypeToKind(
        property.typeAnnotation.returnTypeAnnotation.type,
      ),
    )
    .replace(/::_PROPERTY_NAME_::/g, property.name)
    .replace(
      /::_ARGS_::/g,
      numberOfParams === 0
        ? ''
        : (numberOfParams === 1 ? '' : ':') + translatedArguments,
    );
}

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    moduleSpecName: string,
  ): FilesOutput {
    const nativeModules: {[name: string]: NativeModuleShape, ...} = Object.keys(
      schema.modules,
    )
      .map(moduleName => {
        const modules = schema.modules[moduleName].nativeModules;
        if (modules == null) {
          return null;
        }

        return modules;
      })
      .filter(Boolean)
      .reduce((acc, modules) => Object.assign(acc, modules), {});

    const gettersImplementations = Object.keys(nativeModules)
      .reduce((acc, moduleName: string) => {
        const module: NativeModuleShape = nativeModules[moduleName];
        return acc.concat(
          flatObjects(
            module.properties.reduce((moduleAcc, property) => {
              const {returnTypeAnnotation} = property.typeAnnotation;
              if (returnTypeAnnotation.type === 'ObjectTypeAnnotation') {
                const {properties} = returnTypeAnnotation;
                if (properties) {
                  moduleAcc.push({
                    name: capitalizeFirstLetter(property.name) + 'ReturnType',
                    object: {
                      type: 'ObjectTypeAnnotation',
                      properties: properties,
                    },
                  });
                }
              }
              if (property.typeAnnotation.params) {
                return moduleAcc.concat(
                  property.typeAnnotation.params
                    .map(param => {
                      if (
                        param.typeAnnotation.type === 'ObjectTypeAnnotation'
                      ) {
                        const {properties} = param.typeAnnotation;
                        if (properties) {
                          return {
                            name:
                              capitalizeFirstLetter(property.name) +
                              capitalizeFirstLetter(param.name),
                            object: {
                              type: 'ObjectTypeAnnotation',
                              properties: properties,
                            },
                          };
                        }
                      }
                    })
                    .filter(Boolean),
                );
              }
              return moduleAcc;
            }, []),
          )
            .map(object =>
              getterTemplate
                .replace(/::_GETTER_NAME_::/g, object.name)
                .replace(/::_MODULE_NAME_::/g, moduleName),
            )
            .join('\n'),
        );
      }, [])
      .join('\n');

    const modules = Object.keys(nativeModules)
      .map(name => {
        const {properties} = nativeModules[name];
        const translatedMethods = properties
          .map(property => tranlsateMethodForImplementation(property))
          .join('\n');
        return moduleTemplate
          .replace(/::_TURBOMODULE_METHOD_INVOKERS_::/g, translatedMethods)
          .replace(
            '::_PROPERTIES_MAP_::',
            properties
              .map(
                ({
                  name: propertyName,
                  typeAnnotation: {params, returnTypeAnnotation},
                }) =>
                  propertyName === 'getConstants' &&
                  returnTypeAnnotation.type === 'ObjectTypeAnnotation' &&
                  returnTypeAnnotation.properties &&
                  returnTypeAnnotation.properties.length === 0
                    ? ''
                    : proprertyDefTemplate
                        .replace(/::_PROPERTY_NAME_::/g, propertyName)
                        .replace(/::_ARGS_COUNT_::/g, params.length.toString()),
              )
              .join('\n'),
          )
          .replace(
            '::_CONVERSION_SELECTORS_::',
            properties
              .map(({name: propertyName, typeAnnotation: {params}}) =>
                params
                  .map((param, index) =>
                    param.typeAnnotation.type === 'ObjectTypeAnnotation' &&
                    param.typeAnnotation.properties
                      ? argConvertionTemplate
                          .replace(
                            '::_SELECTOR_NAME_::',
                            capitalizeFirstLetter(propertyName) +
                              capitalizeFirstLetter(param.name),
                          )
                          .replace('::_ARG_NUMBER_::', index.toString())
                          .replace('::_ARG_NAME_::', propertyName)
                      : '',
                  )
                  .join(''),
              )
              .join(''),
          )
          .replace(/::_MODULE_NAME_::/g, name);
      })
      .join('\n');

    const fileName = `${moduleSpecName}-generated.mm`;
    const replacedTemplate = template
      .replace(/::_GETTERS_::/g, gettersImplementations)
      .replace(/::_MODULES_::/g, modules)
      .replace(/::_LIBRARY_NAME_::/g, libraryName)
      .replace(/::_INCLUDE_::/g, `${moduleSpecName}/${moduleSpecName}.h`);
    return new Map([[fileName, replacedTemplate]]);
  },
};
