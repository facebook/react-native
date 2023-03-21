/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';
import type {ASTNode} from '../utils';
import type {NamedShape} from '../../../CodegenSchema.js';
const {parseTopLevelType} = require('../parseTopLevelType');
import type {TypeDeclarationMap} from '../../utils';

function getProperties(
  typeName: string,
  types: TypeDeclarationMap,
): $FlowFixMe {
  const alias = types[typeName];
  if (!alias) {
    throw new Error(
      `Failed to find definition for "${typeName}", please check that you have a valid codegen typescript file`,
    );
  }
  const aliasKind =
    alias.type === 'TSInterfaceDeclaration' ? 'interface' : 'type';

  try {
    if (aliasKind === 'interface') {
      return [...(alias.extends ?? []), ...alias.body.body];
    }

    return (
      alias.typeAnnotation.members ||
      alias.typeAnnotation.typeParameters.params[0].members ||
      alias.typeAnnotation.typeParameters.params
    );
  } catch (e) {
    throw new Error(
      `Failed to find ${aliasKind} definition for "${typeName}", please check that you have a valid codegen typescript file`,
    );
  }
}

function getUnionOfLiterals(
  name: string,
  forArray: boolean,
  elementTypes: $FlowFixMe[],
  defaultValue: $FlowFixMe | void,
  types: TypeDeclarationMap,
) {
  elementTypes.reduce((lastType, currType) => {
    const lastFlattenedType =
      lastType && lastType.type === 'TSLiteralType'
        ? lastType.literal.type
        : lastType.type;
    const currFlattenedType =
      currType.type === 'TSLiteralType' ? currType.literal.type : currType.type;

    if (lastFlattenedType && currFlattenedType !== lastFlattenedType) {
      throw new Error(`Mixed types are not supported (see "${name}")`);
    }
    return currType;
  });

  if (defaultValue === undefined) {
    throw new Error(`A default enum value is required for "${name}"`);
  }

  const unionType = elementTypes[0].type;
  if (
    unionType === 'TSLiteralType' &&
    elementTypes[0].literal?.type === 'StringLiteral'
  ) {
    return {
      type: 'StringEnumTypeAnnotation',
      default: (defaultValue: string),
      options: elementTypes.map(option => option.literal.value),
    };
  } else if (
    unionType === 'TSLiteralType' &&
    elementTypes[0].literal?.type === 'NumericLiteral'
  ) {
    if (forArray) {
      throw new Error(`Arrays of int enums are not supported (see: "${name}")`);
    } else {
      return {
        type: 'Int32EnumTypeAnnotation',
        default: (defaultValue: number),
        options: elementTypes.map(option => option.literal.value),
      };
    }
  } else {
    throw new Error(
      `Unsupported union type for "${name}", received "${
        unionType === 'TSLiteralType'
          ? elementTypes[0].literal?.type
          : unionType
      }"`,
    );
  }
}

function detectArrayType<T>(
  name: string,
  typeAnnotation: $FlowFixMe | ASTNode,
  defaultValue: $FlowFixMe | void,
  types: TypeDeclarationMap,
  buildSchema: (property: PropAST, types: TypeDeclarationMap) => ?NamedShape<T>,
): $FlowFixMe {
  // Covers: readonly T[]
  if (
    typeAnnotation.type === 'TSTypeOperator' &&
    typeAnnotation.operator === 'readonly' &&
    typeAnnotation.typeAnnotation.type === 'TSArrayType'
  ) {
    return {
      type: 'ArrayTypeAnnotation',
      elementType: getTypeAnnotationForArray(
        name,
        typeAnnotation.typeAnnotation.elementType,
        defaultValue,
        types,
        buildSchema,
      ),
    };
  }

  // Covers: T[]
  if (typeAnnotation.type === 'TSArrayType') {
    return {
      type: 'ArrayTypeAnnotation',
      elementType: getTypeAnnotationForArray(
        name,
        typeAnnotation.elementType,
        defaultValue,
        types,
        buildSchema,
      ),
    };
  }

  // Covers: Array<T> and ReadonlyArray<T>
  if (
    typeAnnotation.type === 'TSTypeReference' &&
    (typeAnnotation.typeName.name === 'ReadonlyArray' ||
      typeAnnotation.typeName.name === 'Array')
  ) {
    return {
      type: 'ArrayTypeAnnotation',
      elementType: getTypeAnnotationForArray(
        name,
        typeAnnotation.typeParameters.params[0],
        defaultValue,
        types,
        buildSchema,
      ),
    };
  }

  return null;
}

function getTypeAnnotationForArray<T>(
  name: string,
  typeAnnotation: $FlowFixMe,
  defaultValue: $FlowFixMe | void,
  types: TypeDeclarationMap,
  buildSchema: (property: PropAST, types: TypeDeclarationMap) => ?NamedShape<T>,
): $FlowFixMe {
  // unpack WithDefault, (T) or T|U
  const topLevelType = parseTopLevelType(typeAnnotation, types);
  if (topLevelType.defaultValue !== undefined) {
    throw new Error(
      'Nested optionals such as "ReadonlyArray<boolean | null | undefined>" are not supported, please declare optionals at the top level of value definitions as in "ReadonlyArray<boolean> | null | undefined"',
    );
  }
  if (topLevelType.optional) {
    throw new Error(
      'Nested optionals such as "ReadonlyArray<boolean | null | undefined>" are not supported, please declare optionals at the top level of value definitions as in "ReadonlyArray<boolean> | null | undefined"',
    );
  }

  const extractedTypeAnnotation = topLevelType.type;
  const arrayType = detectArrayType(
    name,
    extractedTypeAnnotation,
    defaultValue,
    types,
    buildSchema,
  );
  if (arrayType) {
    if (arrayType.elementType.type !== 'ObjectTypeAnnotation') {
      throw new Error(
        `Only array of array of object is supported for "${name}".`,
      );
    }
    return arrayType;
  }

  const type =
    extractedTypeAnnotation.elementType === 'TSTypeReference'
      ? extractedTypeAnnotation.elementType.typeName.name
      : extractedTypeAnnotation.elementType?.type ||
        extractedTypeAnnotation.typeName?.name ||
        extractedTypeAnnotation.type;

  switch (type) {
    case 'TSTypeLiteral':
    case 'TSInterfaceDeclaration': {
      const rawProperties =
        type === 'TSInterfaceDeclaration'
          ? [extractedTypeAnnotation]
          : extractedTypeAnnotation.members;
      if (rawProperties === undefined) {
        throw new Error(type);
      }
      return {
        type: 'ObjectTypeAnnotation',
        properties: flattenProperties(rawProperties, types)
          .map(prop => buildSchema(prop, types))
          .filter(Boolean),
      };
    }
    case 'TSNumberKeyword':
      return {
        type: 'FloatTypeAnnotation',
      };
    case 'ImageSource':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ImageSourcePrimitive',
      };
    case 'ImageRequest':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ImageRequestPrimitive',
      };
    case 'ColorValue':
    case 'ProcessedColorValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ColorPrimitive',
      };
    case 'PointValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'PointPrimitive',
      };
    case 'EdgeInsetsValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'EdgeInsetsPrimitive',
      };
    case 'Stringish':
      return {
        type: 'StringTypeAnnotation',
      };
    case 'Int32':
      return {
        type: 'Int32TypeAnnotation',
      };
    case 'Double':
      return {
        type: 'DoubleTypeAnnotation',
      };
    case 'Float':
      return {
        type: 'FloatTypeAnnotation',
      };
    case 'TSBooleanKeyword':
      return {
        type: 'BooleanTypeAnnotation',
      };
    case 'TSStringKeyword':
      return {
        type: 'StringTypeAnnotation',
      };
    case 'TSUnionType':
      return getUnionOfLiterals(
        name,
        true,
        extractedTypeAnnotation.types,
        defaultValue,
        types,
      );
    default:
      (type: empty);
      throw new Error(`Unknown prop type for "${name}": ${type}`);
  }
}

function getTypeAnnotation<T>(
  name: string,
  annotation: $FlowFixMe | ASTNode,
  defaultValue: $FlowFixMe | void,
  types: TypeDeclarationMap,
  buildSchema: (property: PropAST, types: TypeDeclarationMap) => ?NamedShape<T>,
): $FlowFixMe {
  // unpack WithDefault, (T) or T|U
  const topLevelType = parseTopLevelType(annotation, types);
  const typeAnnotation = topLevelType.type;
  const arrayType = detectArrayType(
    name,
    typeAnnotation,
    defaultValue,
    types,
    buildSchema,
  );
  if (arrayType) {
    return arrayType;
  }

  const type =
    typeAnnotation.type === 'TSTypeReference' ||
    typeAnnotation.type === 'TSTypeAliasDeclaration'
      ? typeAnnotation.typeName.name
      : typeAnnotation.type;

  switch (type) {
    case 'TSTypeLiteral':
    case 'TSInterfaceDeclaration': {
      const rawProperties =
        type === 'TSInterfaceDeclaration'
          ? [typeAnnotation]
          : typeAnnotation.members;
      const flattenedProperties = flattenProperties(rawProperties, types);
      const properties = flattenedProperties
        .map(prop => buildSchema(prop, types))
        .filter(Boolean);

      return {
        type: 'ObjectTypeAnnotation',
        properties,
      };
    }
    case 'ImageSource':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ImageSourcePrimitive',
      };
    case 'ImageRequest':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ImageRequestPrimitive',
      };
    case 'ColorValue':
    case 'ProcessedColorValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'ColorPrimitive',
      };
    case 'ColorArrayValue':
      return {
        type: 'ArrayTypeAnnotation',
        elementType: {
          type: 'ReservedPropTypeAnnotation',
          name: 'ColorPrimitive',
        },
      };
    case 'PointValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'PointPrimitive',
      };
    case 'EdgeInsetsValue':
      return {
        type: 'ReservedPropTypeAnnotation',
        name: 'EdgeInsetsPrimitive',
      };
    case 'Int32':
      return {
        type: 'Int32TypeAnnotation',
        default: ((defaultValue ? defaultValue : 0): number),
      };
    case 'Double':
      return {
        type: 'DoubleTypeAnnotation',
        default: ((defaultValue ? defaultValue : 0): number),
      };
    case 'Float':
      return {
        type: 'FloatTypeAnnotation',
        default: ((defaultValue === null
          ? null
          : defaultValue
          ? defaultValue
          : 0): number | null),
      };
    case 'TSBooleanKeyword':
      return {
        type: 'BooleanTypeAnnotation',
        default: defaultValue === null ? null : !!defaultValue,
      };
    case 'TSStringKeyword':
      return {
        type: 'StringTypeAnnotation',
        default: ((defaultValue === undefined ? null : defaultValue):
          | string
          | null),
      };
    case 'Stringish':
      return {
        type: 'StringTypeAnnotation',
        default: ((defaultValue === undefined ? null : defaultValue):
          | string
          | null),
      };
    case 'TSNumberKeyword':
      throw new Error(
        `Cannot use "${type}" type annotation for "${name}": must use a specific numeric type like Int32, Double, or Float`,
      );
    case 'TSUnionType':
      return getUnionOfLiterals(
        name,
        false,
        typeAnnotation.types,
        defaultValue,
        types,
      );
    default:
      (type: empty);
      throw new Error(`Unknown prop type for "${name}": "${type}"`);
  }
}

type SchemaInfo = {
  name: string,
  optional: boolean,
  typeAnnotation: $FlowFixMe,
  defaultValue: $FlowFixMe,
};

function getSchemaInfo(
  property: PropAST,
  types: TypeDeclarationMap,
): SchemaInfo {
  // unpack WithDefault, (T) or T|U
  const topLevelType = parseTopLevelType(
    property.typeAnnotation.typeAnnotation,
    types,
  );

  const name = property.key.name;

  if (!property.optional && topLevelType.defaultValue !== undefined) {
    throw new Error(
      `key ${name} must be optional if used with WithDefault<> annotation`,
    );
  }

  return {
    name,
    optional: property.optional || topLevelType.optional,
    typeAnnotation: topLevelType.type,
    defaultValue: topLevelType.defaultValue,
  };
}

// $FlowFixMe[unclear-type] TODO(T108222691): Use flow-types for @babel/parser
type PropAST = Object;

function verifyPropNotAlreadyDefined(
  props: $ReadOnlyArray<PropAST>,
  needleProp: PropAST,
) {
  const propName = needleProp.key.name;
  const foundProp = props.some(prop => prop.key.name === propName);
  if (foundProp) {
    throw new Error(`A prop was already defined with the name ${propName}`);
  }
}

function flattenProperties(
  typeDefinition: $ReadOnlyArray<PropAST>,
  types: TypeDeclarationMap,
): $ReadOnlyArray<PropAST> {
  return typeDefinition
    .map(property => {
      if (property.type === 'TSPropertySignature') {
        return property;
      } else if (property.type === 'TSTypeReference') {
        return flattenProperties(
          getProperties(property.typeName.name, types),
          types,
        );
      } else if (
        property.type === 'TSExpressionWithTypeArguments' ||
        property.type === 'TSInterfaceHeritage'
      ) {
        return flattenProperties(
          getProperties(property.expression.name, types),
          types,
        );
      } else if (property.type === 'TSTypeLiteral') {
        return flattenProperties(property.members, types);
      } else if (property.type === 'TSInterfaceDeclaration') {
        return flattenProperties(getProperties(property.id.name, types), types);
      } else {
        throw new Error(
          `${property.type} is not a supported object literal type.`,
        );
      }
    })
    .filter(Boolean)
    .reduce((acc, item) => {
      if (Array.isArray(item)) {
        item.forEach(prop => {
          verifyPropNotAlreadyDefined(acc, prop);
        });
        return acc.concat(item);
      } else {
        verifyPropNotAlreadyDefined(acc, item);
        acc.push(item);
        return acc;
      }
    }, [])
    .filter(Boolean);
}

module.exports = {
  getProperties,
  getSchemaInfo,
  getTypeAnnotation,
  flattenProperties,
};
