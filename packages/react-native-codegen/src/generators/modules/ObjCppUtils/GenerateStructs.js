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
  ObjectParamTypeAnnotation,
  ObjectTypeAliasTypeShape,
} from '../../../CodegenSchema';
const {
  flatObjects,
  capitalizeFirstLetter,
  getSafePropertyName,
} = require('./Utils');
const {getTypeAliasTypeAnnotation} = require('../Utils');
const {generateStructsForConstants} = require('./GenerateStructsForConstants');

const template = `
::_CONSTANTS_::::_STRUCTS_::::_INLINES_::
`;

const structTemplate = `
namespace JS {
  namespace Native::_MODULE_NAME_:: {
    struct ::_STRUCT_NAME_:: {
      ::_STRUCT_PROPERTIES_::

      ::_STRUCT_NAME_::(NSDictionary *const v) : _v(v) {}
    private:
      NSDictionary *_v;
    };
  }
}

@interface RCTCxxConvert (Native::_MODULE_NAME_::_::_STRUCT_NAME_::)
+ (RCTManagedPointer *)JS_Native::_MODULE_NAME_::_::_STRUCT_NAME_:::(id)json;
@end
`;

const inlineTemplate = `
inline ::_RETURN_TYPE_::JS::Native::_MODULE_NAME_::::::_STRUCT_NAME_::::::_PROPERTY_NAME_::() const
{
  id const p = _v[@"::_PROPERTY_NAME_::"];
  return ::_RETURN_VALUE_::;
}
`;

function getNamespacedStructName(structName: string): string {
  return `JS::Native::_MODULE_NAME_::::${structName}`;
}

function getElementTypeForArray(
  property: ObjectParamTypeAnnotation,
  name: string,
  moduleName: string,
  aliases: $ReadOnly<{[aliasName: string]: ObjectTypeAliasTypeShape, ...}>,
): string {
  const {typeAnnotation} = property;

  // TODO(T67898313): Workaround for NativeLinking's use of union type. This check may be removed once typeAnnotation is non-optional.
  if (!typeAnnotation) {
    throw new Error(
      `Cannot get array element type, property ${property.name} does not contain a type annotation`,
    );
  }

  if (typeAnnotation.type !== 'ArrayTypeAnnotation') {
    throw new Error(
      `Cannot get array element type for non-array type ${typeAnnotation.type}`,
    );
  }

  if (!typeAnnotation.elementType) {
    return 'id<NSObject>';
  }

  const type =
    typeAnnotation.elementType.type === 'TypeAliasTypeAnnotation'
      ? getTypeAliasTypeAnnotation(typeAnnotation.elementType.name, aliases)
          .type
      : typeAnnotation.elementType.type;
  switch (type) {
    case 'StringTypeAnnotation':
      return 'NSString *';
    case 'DoubleTypeAnnotation':
    case 'NumberTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
      return 'double';
    case 'ObjectTypeAnnotation':
      const structName =
        typeAnnotation.elementType.type === 'TypeAliasTypeAnnotation'
          ? typeAnnotation.elementType.name
          : `${property.name}Element`;
      return getNamespacedStructName(structName);
    case 'GenericObjectTypeAnnotation':
      // TODO(T67565166): Generic objects are not type safe and should be disallowed in the schema. This case should throw an error once it is disallowed in schema.
      console.error(
        `Warning: Generic objects are not type safe and should be avoided whenever possible (see '${property.name}' in ${moduleName}'s ${name})`,
      );
      return 'id<NSObject>';
    case 'BooleanTypeAnnotation':
    case 'AnyObjectTypeAnnotation':
    case 'AnyTypeAnnotation':
    case 'ArrayTypeAnnotation':
    case 'FunctionTypeAnnotation':
    case 'ReservedFunctionValueTypeAnnotation':
    case 'ReservedPropTypeAnnotation':
    case 'StringEnumTypeAnnotation':
      throw new Error(`Unsupported array element type, found: ${type}"`);
    default:
      (type: empty);
      throw new Error(`Unknown array element type, found: ${type}"`);
  }
}

function getInlineMethodSignature(
  property: ObjectParamTypeAnnotation,
  name: string,
  moduleName: string,
  aliases: $ReadOnly<{[aliasName: string]: ObjectTypeAliasTypeShape, ...}>,
): string {
  const {typeAnnotation} = property;
  function markOptionalTypeIfNecessary(type: string) {
    if (property.optional) {
      return `folly::Optional<${type}>`;
    }
    return type;
  }

  // TODO(T67672788): Workaround for values key in NativeLinking which lacks a typeAnnotation. id<NSObject> is not type safe!
  if (!typeAnnotation) {
    console.error(
      `Warning: Unsafe type found (see '${property.name}' in ${moduleName}'s ${name})`,
    );
    return `id<NSObject> ${getSafePropertyName(property)}() const;`;
  }

  const realTypeAnnotation =
    typeAnnotation.type === 'TypeAliasTypeAnnotation'
      ? getTypeAliasTypeAnnotation(typeAnnotation.name, aliases)
      : typeAnnotation;

  const variableName =
    typeAnnotation.type === 'TypeAliasTypeAnnotation'
      ? `${capitalizeFirstLetter(typeAnnotation.name)}`
      : `${capitalizeFirstLetter(name)}${capitalizeFirstLetter(
          getSafePropertyName(property),
        )}`;

  switch (realTypeAnnotation.type) {
    case 'ReservedFunctionValueTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return `double ${getSafePropertyName(property)}() const;`;
        default:
          (realTypeAnnotation.name: empty);
          throw new Error(
            `Unknown prop type, found: ${realTypeAnnotation.name}"`,
          );
      }
    case 'StringTypeAnnotation':
      return `NSString *${getSafePropertyName(property)}() const;`;
    case 'NumberTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
      return `${markOptionalTypeIfNecessary('double')} ${getSafePropertyName(
        property,
      )}() const;`;
    case 'BooleanTypeAnnotation':
      return `${markOptionalTypeIfNecessary('bool')} ${getSafePropertyName(
        property,
      )}() const;`;
    case 'ObjectTypeAnnotation':
      return `${markOptionalTypeIfNecessary(
        getNamespacedStructName(variableName),
      )} ${getSafePropertyName(property)}() const;`;
    case 'GenericObjectTypeAnnotation':
    case 'AnyTypeAnnotation':
      return `id<NSObject> ${
        property.optional ? '_Nullable ' : ' '
      }${getSafePropertyName(property)}() const;`;
    case 'ArrayTypeAnnotation':
      return `${markOptionalTypeIfNecessary(
        `facebook::react::LazyVector<${getElementTypeForArray(
          property,
          name,
          moduleName,
          aliases,
        )}>`,
      )} ${getSafePropertyName(property)}() const;`;
    case 'FunctionTypeAnnotation':
    default:
      throw new Error(`Unknown prop type, found: ${realTypeAnnotation.type}"`);
  }
}

function getInlineMethodImplementation(
  property: ObjectParamTypeAnnotation,
  name: string,
  moduleName: string,
  aliases: $ReadOnly<{[aliasName: string]: ObjectTypeAliasTypeShape, ...}>,
): string {
  const {typeAnnotation} = property;
  function markOptionalTypeIfNecessary(type: string): string {
    if (property.optional) {
      return `folly::Optional<${type}> `;
    }
    return `${type} `;
  }
  function markOptionalValueIfNecessary(value: string): string {
    if (property.optional) {
      return `RCTBridgingToOptional${capitalizeFirstLetter(value)}`;
    }
    return `RCTBridgingTo${capitalizeFirstLetter(value)}`;
  }
  function bridgeArrayElementValueIfNecessary(element: string): string {
    // TODO(T67898313): Workaround for NativeLinking's use of union type
    if (!typeAnnotation) {
      throw new Error(
        `Cannot get array element type, property ${property.name} does not contain a type annotation`,
      );
    }

    if (typeAnnotation.type !== 'ArrayTypeAnnotation') {
      throw new Error(
        `Cannot get array element type for non-array type ${typeAnnotation.type}`,
      );
    }

    if (!typeAnnotation.elementType) {
      throw new Error(`Cannot get array element type for ${name}`);
    }

    const type =
      typeAnnotation.elementType.type === 'TypeAliasTypeAnnotation'
        ? getTypeAliasTypeAnnotation(typeAnnotation.elementType.name, aliases)
            .type
        : typeAnnotation.elementType.type;

    switch (type) {
      case 'StringTypeAnnotation':
        return `RCTBridgingToString(${element})`;
      case 'DoubleTypeAnnotation':
      case 'NumberTypeAnnotation':
      case 'FloatTypeAnnotation':
      case 'Int32TypeAnnotation':
        return `RCTBridgingToDouble(${element})`;
      case 'BooleanTypeAnnotation':
        return `RCTBridgingToBool(${element})`;
      case 'ObjectTypeAnnotation':
        const structName =
          typeAnnotation.elementType.type === 'TypeAliasTypeAnnotation'
            ? `${typeAnnotation.elementType.name}(${element})`
            : `${getSafePropertyName(property)}Element(${element})`;
        return getNamespacedStructName(structName);
      case 'GenericObjectTypeAnnotation':
        return element;
      case 'AnyObjectTypeAnnotation':
      case 'AnyTypeAnnotation':
      case 'ArrayTypeAnnotation':
      case 'FunctionTypeAnnotation':
      case 'ReservedFunctionValueTypeAnnotation':
      case 'ReservedPropTypeAnnotation':
      case 'StringEnumTypeAnnotation':
      case 'TupleTypeAnnotation':
        throw new Error(`Unsupported array element type, found: ${type}"`);
      default:
        (type: empty);
        throw new Error(`Unknown array element type, found: ${type}"`);
    }
  }

  // TODO(T67672788): Workaround for values key in NativeLinking which lacks a typeAnnotation. id<NSObject> is not type safe!
  if (!typeAnnotation) {
    console.error(
      `Warning: Unsafe type found (see '${property.name}' in ${moduleName}'s ${name})`,
    );
    return inlineTemplate
      .replace(
        /::_RETURN_TYPE_::/,
        property.optional ? 'id<NSObject> _Nullable ' : 'id<NSObject> ',
      )
      .replace(/::_RETURN_VALUE_::/, 'p');
  }

  const realTypeAnnotation =
    typeAnnotation.type === 'TypeAliasTypeAnnotation'
      ? getTypeAliasTypeAnnotation(typeAnnotation.name, aliases)
      : typeAnnotation;

  switch (realTypeAnnotation.type) {
    case 'ReservedFunctionValueTypeAnnotation':
      switch (realTypeAnnotation.name) {
        case 'RootTag':
          return inlineTemplate
            .replace(/::_RETURN_TYPE_::/, 'double ')
            .replace(/::_RETURN_VALUE_::/, 'RCTBridgingToDouble(p)');
        default:
          (realTypeAnnotation.name: empty);
          throw new Error(
            `Unknown prop type, found: ${realTypeAnnotation.name}"`,
          );
      }
    case 'StringTypeAnnotation':
      return inlineTemplate
        .replace(/::_RETURN_TYPE_::/, 'NSString *')
        .replace(/::_RETURN_VALUE_::/, 'RCTBridgingToString(p)');
    case 'NumberTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
      return inlineTemplate
        .replace(/::_RETURN_TYPE_::/, markOptionalTypeIfNecessary('double'))
        .replace(
          /::_RETURN_VALUE_::/,
          `${markOptionalValueIfNecessary('double')}(p)`,
        );
    case 'BooleanTypeAnnotation':
      return inlineTemplate
        .replace(/::_RETURN_TYPE_::/, markOptionalTypeIfNecessary('bool'))
        .replace(
          /::_RETURN_VALUE_::/,
          `${markOptionalValueIfNecessary('bool')}(p)`,
        );
    case 'GenericObjectTypeAnnotation':
    case 'AnyTypeAnnotation':
      return inlineTemplate
        .replace(
          /::_RETURN_TYPE_::/,
          property.optional ? 'id<NSObject> _Nullable ' : 'id<NSObject> ',
        )
        .replace(/::_RETURN_VALUE_::/, 'p');
    case 'ObjectTypeAnnotation':
      const structName =
        typeAnnotation.type === 'TypeAliasTypeAnnotation'
          ? `${capitalizeFirstLetter(typeAnnotation.name)}`
          : `${name}${capitalizeFirstLetter(getSafePropertyName(property))}`;
      const namespacedStructName = getNamespacedStructName(structName);
      return inlineTemplate
        .replace(
          /::_RETURN_TYPE_::/,
          markOptionalTypeIfNecessary(namespacedStructName),
        )
        .replace(
          /::_RETURN_VALUE_::/,
          property.optional
            ? `(p == nil ? folly::none : folly::make_optional(${namespacedStructName}(p)))`
            : `${namespacedStructName}(p)`,
        );
    case 'ArrayTypeAnnotation':
      return inlineTemplate
        .replace(
          /::_RETURN_TYPE_::/,
          markOptionalTypeIfNecessary(
            `facebook::react::LazyVector<${getElementTypeForArray(
              property,
              name,
              moduleName,
              aliases,
            )}>`,
          ),
        )
        .replace(
          /::_RETURN_VALUE_::/,
          `${markOptionalValueIfNecessary('vec')}(p, ^${getElementTypeForArray(
            property,
            name,
            moduleName,
            aliases,
          )}(id itemValue_0) { return ${bridgeArrayElementValueIfNecessary(
            'itemValue_0',
          )}; })`,
        );
    case 'FunctionTypeAnnotation':
    default:
      throw new Error(`Unknown prop type, found: ${realTypeAnnotation.type}"`);
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
  moduleName: string,
  aliases: $ReadOnly<{[aliasName: string]: ObjectTypeAliasTypeShape, ...}>,
): string {
  const flattenObjects = flatObjects(annotations, false, aliases);

  const translatedInlineMethods = flattenObjects
    .reduce(
      (acc, object) =>
        acc.concat(
          object.properties.map(property =>
            getInlineMethodImplementation(
              property,
              object.name,
              moduleName,
              aliases,
            )
              .replace(/::_PROPERTY_NAME_::/g, getSafePropertyName(property))
              .replace(/::_STRUCT_NAME_::/g, object.name),
          ),
        ),
      [],
    )
    .join('\n');

  const translatedStructs = flattenObjects
    .map(object => {
      return structTemplate
        .replace(
          /::_STRUCT_PROPERTIES_::/g,
          object.properties
            .map(property =>
              getInlineMethodSignature(
                property,
                object.name,
                moduleName,
                aliases,
              ),
            )
            .join('\n      '),
        )
        .replace(/::_STRUCT_NAME_::/g, object.name);
    })
    .reverse()
    .join('\n');
  const translatedConstants = generateStructsForConstants(annotations, aliases);

  return template
    .replace(/::_STRUCTS_::/, translatedStructs)
    .replace(/::_INLINES_::/, translatedInlineMethods)
    .replace(/::_CONSTANTS_::/, translatedConstants);
}
module.exports = {
  translateObjectsForStructs,
  capitalizeFirstLetter,
  getNamespacedStructName,
};
