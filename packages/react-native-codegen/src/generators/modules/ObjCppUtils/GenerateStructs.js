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
const {generateStructsForConstants} = require('./GenerateStructsForConstants');

const template = `
::_CONSTANTS_::::_STRUCTS_::::_INLINES_::
`;

const structTemplate = `
namespace JS {
  namespace Native::_MODULE_NAME_:: {
    struct Spec::_STRUCT_NAME_:: {
      ::_STRUCT_PROPERTIES_::

      Spec::_STRUCT_NAME_::(NSDictionary *const v) : _v(v) {}
    private:
      NSDictionary *_v;
    };
  }
}

@interface RCTCxxConvert (Native::_MODULE_NAME_::_Spec::_STRUCT_NAME_::)
+ (RCTManagedPointer *)JS_Native::_MODULE_NAME_::_Spec::_STRUCT_NAME_:::(id)json;
@end
`;

const inlineTemplate = `
inline ::_RETURN_TYPE_::JS::Native::_MODULE_NAME_::::Spec::_STRUCT_NAME_::::::_PROPERTY_NAME_::() const
{
  id const p = _v[@"::_PROPERTY_NAME_::"];
  return ::_RETURN_VALUE_::;
}
`;

function getInlineMethodSignature(
  property: ObjectParamTypeAnnotation,
  name: string,
): string {
  const {typeAnnotation} = property;
  switch (typeAnnotation.type) {
    case 'StringTypeAnnotation':
      return `NSString *${property.name}() const;`;
    case 'NumberTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
      return `double ${property.name}() const;`;
    case 'BooleanTypeAnnotation':
      return `bool ${property.name}() const;`;
    case 'ObjectTypeAnnotation':
      return `JS::Native::_MODULE_NAME_::::Spec${name}${capitalizeFirstLetter(
        property.name,
      )} ${property.name}() const;`;
    case 'GenericObjectTypeAnnotation':
    case 'AnyTypeAnnotation':
      return `id<NSObject> ${property.name}() const;`;
    case 'ArrayTypeAnnotation':
      return `facebook::react::LazyVector<id<NSObject>> ${
        property.name
      }() const;`;
    case 'FunctionTypeAnnotation':
    default:
      throw new Error(`Unknown prop type, found: ${typeAnnotation.type}"`);
  }
}

function getInlineMethodImplementation(
  property: ObjectParamTypeAnnotation,
  name: string,
): string {
  const {typeAnnotation} = property;
  switch (typeAnnotation.type) {
    case 'StringTypeAnnotation':
      return inlineTemplate
        .replace(/::_RETURN_TYPE_::/, 'NSString *')
        .replace(/::_RETURN_VALUE_::/, 'RCTBridgingToString(p)');
    case 'NumberTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
      return inlineTemplate
        .replace(/::_RETURN_TYPE_::/, 'double ')
        .replace(/::_RETURN_VALUE_::/, 'RCTBridgingToDouble(p)');
    case 'BooleanTypeAnnotation':
      return inlineTemplate
        .replace(/::_RETURN_TYPE_::/, 'bool ')
        .replace(/::_RETURN_VALUE_::/, 'RCTBridgingToBool(p)');
    case 'GenericObjectTypeAnnotation':
    case 'AnyTypeAnnotation':
      return inlineTemplate
        .replace(/::_RETURN_TYPE_::/, 'id<NSObject> ')
        .replace(/::_RETURN_VALUE_::/, 'p');
    case 'ObjectTypeAnnotation':
      return inlineTemplate
        .replace(
          /::_RETURN_TYPE_::/,
          `JS::Native::_MODULE_NAME_::::Spec${name}${capitalizeFirstLetter(
            property.name,
          )} `,
        )
        .replace(
          /::_RETURN_VALUE_::/,
          `JS::Native::_MODULE_NAME_::::Spec${name}${capitalizeFirstLetter(
            property.name,
          )}(p)`,
        );
    case 'ArrayTypeAnnotation':
      return inlineTemplate
        .replace(
          /::_RETURN_TYPE_::/,
          'facebook::react::LazyVector<id<NSObject>> ',
        )
        .replace(
          /::_RETURN_VALUE_::/,
          'RCTBridgingToVec(p, ^id<NSObject>(id itemValue_0) { return itemValue_0; })',
        );
    case 'FunctionTypeAnnotation':
    default:
      throw new Error(`Unknown prop type, found: ${typeAnnotation.type}"`);
  }
}

function translateObjectsForStructs(
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
  const flattenObjects = flatObjects(annotations);

  const translatedInlineMethods = flattenObjects
    .reduce(
      (acc, object) =>
        acc.concat(
          object.properties.map(property =>
            getInlineMethodImplementation(property, object.name)
              .replace(/::_PROPERTY_NAME_::/g, property.name)
              .replace(/::_STRUCT_NAME_::/g, object.name),
          ),
        ),
      [],
    )
    .join('\n');

  const translatedStructs = flattenObjects
    .map(object =>
      structTemplate
        .replace(
          /::_STRUCT_PROPERTIES_::/g,
          object.properties
            .map(property => getInlineMethodSignature(property, object.name))
            .join('\n      '),
        )
        .replace(/::_STRUCT_NAME_::/g, object.name),
    )
    .reverse()
    .join('\n');

  const translatedConstants = generateStructsForConstants(annotations);

  return template
    .replace(/::_STRUCTS_::/, translatedStructs)
    .replace(/::_INLINES_::/, translatedInlineMethods)
    .replace(/::_CONSTANTS_::/, translatedConstants);
}
module.exports = {
  translateObjectsForStructs,
  capitalizeFirstLetter,
};
