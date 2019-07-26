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

import type {ObjectParamTypeAnnotation} from '../../../CodegenSchema';
import {flatObjects, capitalizeFirstLetter} from './Utils';

const structTemplate = `
namespace JS {
  namespace Native::_MODULE_NAME_:: {
    struct ::_STRUCT_NAME_:: {

      struct Builder {
        struct Input {
          ::_INPUT_::
        };

        /** Initialize with a set of values */
        Builder(const Input i);
        /** Initialize with an existing ::_STRUCT_NAME_:: */
        Builder(::_STRUCT_NAME_:: i);
        /** Builds the object. Generally used only by the infrastructure. */
        NSDictionary *buildUnsafeRawValue() const { return _factory(); };
      private:
        NSDictionary *(^_factory)(void);
      };

      static ::_STRUCT_NAME_:: fromUnsafeRawValue(NSDictionary *const v) { return {v}; }
      NSDictionary *unsafeRawValue() const { return _v; }
    private:
      ::_STRUCT_NAME_::(NSDictionary *const v) : _v(v) {}
      NSDictionary *_v;
    };
  }
}

@protocol Native::_MODULE_NAME_::Spec <RCTBridgeModule, RCTTurboModule>

- (facebook::react::ModuleConstants<JS::Native::_MODULE_NAME_::::::_STRUCT_NAME_::::Builder>)constantsToExport;
- (facebook::react::ModuleConstants<JS::Native::_MODULE_NAME_::::::_STRUCT_NAME_::::Builder>)getConstants;

@end

inline JS::Native::_MODULE_NAME_::::::_STRUCT_NAME_::::Builder::Builder(const Input i) : _factory(^{
  NSMutableDictionary *d = [NSMutableDictionary new];
  ::_PROPERTIES_::
  return d;
}) {}
inline JS::Native::_MODULE_NAME_::::::_STRUCT_NAME_::::Builder::Builder(::_STRUCT_NAME_:: i) : _factory(^{
  return i.unsafeRawValue();
}) {}`;

function getBuilderInputFieldDeclaration(
  property: ObjectParamTypeAnnotation,
  name: string,
): string {
  function markRequiredIfNecessary(annotation) {
    if (!property.optional) {
      return 'RCTRequired<' + annotation + '> ' + property.name + ';';
    }
    return annotation + ' ' + property.name + ';';
  }
  const {typeAnnotation} = property;
  switch (typeAnnotation.type) {
    case 'StringTypeAnnotation':
      return markRequiredIfNecessary('NSString *');
    case 'NumberTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
      return markRequiredIfNecessary('double');
    case 'BooleanTypeAnnotation':
      return markRequiredIfNecessary('bool');
    case 'ObjectTypeAnnotation':
      return markRequiredIfNecessary(
        `JS::Native::_MODULE_NAME_::::Spec${name}${capitalizeFirstLetter(
          property.name,
        )}::Builder`,
      );
    case 'GenericObjectTypeAnnotation':
    case 'AnyTypeAnnotation':
      return markRequiredIfNecessary('id<NSObject>');
    case 'ArrayTypeAnnotation':
      return markRequiredIfNecessary('std::vector<id<NSObject>>');
    case 'FunctionTypeAnnotation':
    default:
      throw new Error(`Unknown prop type, found: ${typeAnnotation.type}"`);
  }
}

function safeGetter(name: string) {
  return `
  auto ${name} = i.${name}.get();
  d[@"${name}"] = ${name};
  `.trim();
}

function arrayGetter(name: string) {
  return `
  auto ${name} = i.${name}.get();
  d[@"${name}"] = RCTConvertVecToArray(${name}, ^id(id<NSObject> el_) { return el_; });
  `.trim();
}

function numberAndBoolGetter(name: string) {
  return `
  auto ${name} = i.${name}.get();
  d[@"${name}"] = @(${name});
  `.trim();
}

function unsafeGetter(name: string) {
  return `
  auto ${name} = i.${name}.get();
  d[@"${name}"] = ${name};
  `.trim();
}

function getObjectProperty(property: ObjectParamTypeAnnotation): string {
  const {typeAnnotation} = property;
  switch (typeAnnotation.type) {
    case 'NumberTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'BooleanTypeAnnotation':
      return numberAndBoolGetter(property.name);
    case 'StringTypeAnnotation':
    case 'GenericObjectTypeAnnotation':
    case 'AnyTypeAnnotation':
      return safeGetter(property.name);
    case 'ObjectTypeAnnotation':
      return unsafeGetter(property.name);
    case 'ArrayTypeAnnotation':
      return arrayGetter(property.name);
    case 'FunctionTypeAnnotation':
    default:
      throw new Error(`Unknown prop type, found: ${typeAnnotation.type}"`);
  }
}

function generateStructsForConstants(
  annotations: $ReadOnlyArray<
    $ReadOnly<{|
      name: string,
      object: $ReadOnly<{|
        type: 'ObjectTypeAnnotation',
        properties: $ReadOnlyArray<ObjectParamTypeAnnotation>,
      |}>,
    |}>,
  >,
): string {
  return flatObjects(annotations, true)
    .reduce(
      (acc, object) =>
        acc.concat(
          structTemplate
            .replace(
              /::_INPUT_::/g,
              object.properties
                .map(property =>
                  getBuilderInputFieldDeclaration(property, object.name),
                )
                .join('\n          '),
            )
            .replace(
              /::_PROPERTIES_::/g,
              object.properties
                .map(property => getObjectProperty(property))
                .join('\n'),
            )
            .replace(/::_STRUCT_NAME_::/g, object.name),
        ),
      [],
    )
    .join('\n')
    .replace(/GetConstantsReturnType/g, 'Constants');
}
module.exports = {
  generateStructsForConstants,
  capitalizeFirstLetter,
};
