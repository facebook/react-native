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
const {flatObjects, capitalizeFirstLetter} = require('./Utils');

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
    return 'folly::Optional<' + annotation + '> ' + property.name + ';';
  }
  const {typeAnnotation} = property;

  // TODO(T67898313): Workaround for NativeLinking's use of union type. This check may be removed once typeAnnotation is non-optional.
  if (!typeAnnotation) {
    throw new Error(
      `Cannot get array element type, property ${property.name} does not contain a type annotation`,
    );
  }

  switch (typeAnnotation.type) {
    case 'ReservedFunctionValueTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'RootTag':
          return markRequiredIfNecessary('double');
        default:
          (typeAnnotation.name: empty);
          throw new Error(`Unknown prop type, found: ${typeAnnotation.name}"`);
      }
    case 'StringTypeAnnotation':
      if (property.optional) {
        return 'NSString *' + property.name + ';';
      }
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
      if (property.optional) {
        return 'id<NSObject> _Nullable ' + property.name + ';';
      }
      return markRequiredIfNecessary('id<NSObject>');
    case 'ArrayTypeAnnotation':
      return markRequiredIfNecessary('std::vector<id<NSObject>>');
    case 'FunctionTypeAnnotation':
    default:
      throw new Error(`Unknown prop type, found: ${typeAnnotation.type}"`);
  }
}

function safeGetter(name: string, optional: boolean) {
  return `
  auto ${name} = i.${name}${optional ? '' : '.get()'};
  d[@"${name}"] = ${name};
  `.trim();
}

function arrayGetter(name: string, optional: boolean) {
  return `
  auto ${name} = i.${name}${optional ? '' : '.get()'};
  d[@"${name}"] = RCTConvert${
    optional ? 'Optional' : ''
  }VecToArray(${name}, ^id(id<NSObject> el_) { return el_; });
  `.trim();
}

function boolGetter(name: string, optional: boolean) {
  return `
  auto ${name} = i.${name}${optional ? '' : '.get()'};
  d[@"${name}"] = ${
    optional
      ? `${name}.hasValue() ? @((BOOL)${name}.value()) : nil`
      : `@(${name})`
  };
  `.trim();
}

function numberGetter(name: string, optional: boolean) {
  return `
  auto ${name} = i.${name}${optional ? '' : '.get()'};
  d[@"${name}"] = ${
    optional
      ? `${name}.hasValue() ? @((double)${name}.value()) : nil`
      : `@(${name})`
  };
  `.trim();
}

function unsafeGetter(name: string, optional: boolean) {
  return `
  auto ${name} = i.${name}${optional ? '' : '.get()'};
  d[@"${name}"] = ${
    optional
      ? `${name}.hasValue() ? ${name}.value().buildUnsafeRawValue() : nil`
      : `${name}.buildUnsafeRawValue()`
  };
  `.trim();
}

function getObjectProperty(property: ObjectParamTypeAnnotation): string {
  const {typeAnnotation} = property;

  // TODO(T67898313): Workaround for NativeLinking's use of union type. This check may be removed once typeAnnotation is non-optional.
  if (!typeAnnotation) {
    throw new Error(
      `Cannot get array element type, property ${property.name} does not contain a type annotation`,
    );
  }

  switch (typeAnnotation.type) {
    case 'ReservedFunctionValueTypeAnnotation':
      switch (typeAnnotation.name) {
        case 'RootTag':
          return numberGetter(property.name, property.optional);
        default:
          (typeAnnotation.name: empty);
          throw new Error(`Unknown prop type, found: ${typeAnnotation.name}"`);
      }
    case 'NumberTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
      return numberGetter(property.name, property.optional);
    case 'BooleanTypeAnnotation':
      return boolGetter(property.name, property.optional);
    case 'StringTypeAnnotation':
    case 'GenericObjectTypeAnnotation':
    case 'AnyTypeAnnotation':
      return safeGetter(property.name, property.optional);
    case 'ObjectTypeAnnotation':
      return unsafeGetter(property.name, property.optional);
    case 'ArrayTypeAnnotation':
      return arrayGetter(property.name, property.optional);
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
    .reverse()
    .join('\n')
    .replace(/SpecGetConstantsReturnType/g, 'Constants')
    .replace(/GetConstantsReturnType/g, 'Constants');
}
module.exports = {
  generateStructsForConstants,
  capitalizeFirstLetter,
};
