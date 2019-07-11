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

import type {SchemaType} from '../../CodegenSchema';

type FilesOutput = Map<string, string>;

const propertyHeaderTemplate =
  'static jsi::Value __hostFunction_Native::_MODULE_NAME_::TurboCxxModuleSpecJSI_::_PROPERTY_NAME_::(jsi::Runtime &rt, TurboModule &turboModule, const jsi::Value* args, size_t count) {';

const propertyCastTemplate =
  'static_cast<Native::_MODULE_NAME_::TurboCxxModuleSpecJSI *>(&turboModule)->::_PROPERTY_NAME_::(rt::_ARGS_::);';

const nonvoidPropertyTemplate = `
${propertyHeaderTemplate}
  return ${propertyCastTemplate}
}`;

const voidPropertyTemplate = `
${propertyHeaderTemplate}
  ${propertyCastTemplate}
  return jsi::Value::undefined();
}`;

const proprertyDefTemplate =
  '  methodMap_["::_PROPERTY_NAME_::"] = MethodMetadata {::_ARGS_COUNT_::, __hostFunction_Native::_MODULE_NAME_::TurboCxxModuleSpecJSI_::_PROPERTY_NAME_::};';

const moduleTemplate = `
::_MODULE_PROPERTIES_::​

Native::_MODULE_NAME_::TurboCxxModuleSpecJSI::Native::_MODULE_NAME_::TurboCxxModuleSpecJSI(std::shared_ptr<JSCallInvoker> jsInvoker)
  : TurboModule("::_MODULE_NAME_::TurboCxxModule", jsInvoker) {
::_PROPERTIES_MAP_::
}
`;

const template = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Native::_MODULE_NAME_::TurboCxxModuleSpecJSI.h"

namespace facebook {
namespace react {

::_MODULES_::


} // namespace react
} // namespace facebook
`;

function traverseArg(arg, index): string {
  function wrap(suffix) {
    return `args[${index}]${suffix}`;
  }
  const type = arg.typeAnnotation.type;
  switch (type) {
    case 'StringTypeAnnotation':
      return wrap('.getString(rt)');
    case 'BooleanTypeAnnotation':
      return wrap('.getBool(rt)');
    case 'NumberTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
      return wrap('.getNumber(rt)');
    case 'ArrayTypeAnnotation':
      return wrap('.getObject(rt).getArray(rt)');
    case 'FunctionTypeAnnotation':
      return `std::move(${wrap('.getObject(rt).getFunction(rt)')})`;
    case 'GenericObjectTypeAnnotation':
    case 'ObjectTypeAnnotation':
      return wrap('.getObject(rt)');
    case 'AnyTypeAnnotation':
      throw new Error(`Any type is not allowed in params for "${arg.name}"`);

    default:
      (type: empty);
      throw new Error(`Unknown prop type for "${arg.name}, found: ${type}"`);
  }
}

function traverseProprety(property): string {
  const propertyTemplate =
    property.typeAnnotation.returnTypeAnnotation.type === 'VoidTypeAnnotation'
      ? voidPropertyTemplate
      : nonvoidPropertyTemplate;
  const traversedArgs = property.typeAnnotation.params
    .map(traverseArg)
    .join(', ');
  return propertyTemplate
    .replace(/::_PROPERTY_NAME_::/g, property.name)
    .replace(/::_ARGS_::/g, traversedArgs === '' ? '' : ', ' + traversedArgs);
}

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
      .reduce((acc, modules) => Object.assign(acc, modules), {});

    const modules = Object.keys(nativeModules)
      .map(name => {
        const {properties} = nativeModules[name];
        const traversedProperties = properties
          .map(property => traverseProprety(property))
          .join('\n');
        return moduleTemplate
          .replace(/::_MODULE_PROPERTIES_::/g, traversedProperties)
          .replace(
            '::_PROPERTIES_MAP_::',
            properties
              .map(({name: propertyName, typeAnnotation: {params}}) =>
                proprertyDefTemplate
                  .replace(/::_PROPERTY_NAME_::/g, propertyName)
                  .replace(/::_ARGS_COUNT_::/g, params.length.toString()),
              )
              .join('\n'),
          )
          .replace(/::_MODULE_NAME_::/g, name.slice(0, -11)); // FIXME
      })
      .join('\n');

    const fileName = 'NativeModules.h';
    const replacedTemplate = template.replace(/::_MODULES_::/g, modules);

    return new Map([[fileName, replacedTemplate]]);
  },
};
