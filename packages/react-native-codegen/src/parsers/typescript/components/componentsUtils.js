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
import type {TypeDeclarationMap} from '../utils.js';
import type {NamedShape} from '../../../CodegenSchema.js';
const {getValueFromTypes} = require('../utils.js');

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

function getTypeAnnotationForObjectAsArrayElement<T>(
  name: string,
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  buildSchema: (property: PropAST, types: TypeDeclarationMap) => ?NamedShape<T>,
): $FlowFixMe {
  // for array of array of a type
  // such type must be an object literal
  const elementType = getTypeAnnotationForArray(
    name,
    typeAnnotation,
    null,
    types,
    buildSchema,
  );
  if (elementType.type !== 'ObjectTypeAnnotation') {
    throw new Error(
      `Only array of array of object is supported for "${name}".`,
    );
  }

  return {
    type: 'ArrayTypeAnnotation',
    elementType,
  };
}

function getTypeAnnotationForArray<T>(
  name: string,
  typeAnnotation: $FlowFixMe,
  defaultValue: $FlowFixMe | null,
  types: TypeDeclarationMap,
  buildSchema: (property: PropAST, types: TypeDeclarationMap) => ?NamedShape<T>,
): $FlowFixMe {
  if (typeAnnotation.type === 'TSParenthesizedType') {
    return getTypeAnnotationForArray(
      name,
      typeAnnotation.typeAnnotation,
      defaultValue,
      types,
      buildSchema,
    );
  }

  const extractedTypeAnnotation = getValueFromTypes(typeAnnotation, types);

  if (
    extractedTypeAnnotation.type === 'TSUnionType' &&
    extractedTypeAnnotation.types.some(
      t => t.type === 'TSNullKeyword' || t.type === 'TSUndefinedKeyword',
    )
  ) {
    throw new Error(
      'Nested optionals such as "ReadonlyArray<boolean | null | undefined>" are not supported, please declare optionals at the top level of value definitions as in "ReadonlyArray<boolean> | null | undefined"',
    );
  }

  if (
    extractedTypeAnnotation.type === 'TSTypeReference' &&
    extractedTypeAnnotation.typeName.name === 'WithDefault'
  ) {
    throw new Error(
      'Nested defaults such as "ReadonlyArray<WithDefault<boolean, false>>" are not supported, please declare defaults at the top level of value definitions as in "WithDefault<ReadonlyArray<boolean>, false>"',
    );
  }

  // Covers: T[]
  if (typeAnnotation.type === 'TSArrayType') {
    return getTypeAnnotationForObjectAsArrayElement(
      name,
      typeAnnotation.elementType,
      types,
      buildSchema,
    );
  }

  if (extractedTypeAnnotation.type === 'TSTypeReference') {
    // Resolve the type alias if it's not defined inline
    const objectType = getValueFromTypes(extractedTypeAnnotation, types);

    if (objectType.typeName.name === 'Readonly') {
      return getTypeAnnotationForArray(
        name,
        objectType.typeParameters.params[0],
        defaultValue,
        types,
        buildSchema,
      );
    }

    // Covers: ReadonlyArray<T>
    if (objectType.typeName.name === 'ReadonlyArray') {
      return getTypeAnnotationForObjectAsArrayElement(
        name,
        objectType.typeParameters.params[0],
        types,
        buildSchema,
      );
    }
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
          ? [typeAnnotation]
          : typeAnnotation.members;
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
      typeAnnotation.types.reduce((lastType, currType) => {
        const lastFlattenedType =
          lastType && lastType.type === 'TSLiteralType'
            ? lastType.literal.type
            : lastType.type;
        const currFlattenedType =
          currType.type === 'TSLiteralType'
            ? currType.literal.type
            : currType.type;

        if (lastFlattenedType && currFlattenedType !== lastFlattenedType) {
          throw new Error(`Mixed types are not supported (see "${name}")`);
        }
        return currType;
      });

      if (defaultValue === null) {
        throw new Error(`A default enum value is required for "${name}"`);
      }

      const unionType = typeAnnotation.types[0].type;
      if (
        unionType === 'TSLiteralType' &&
        typeAnnotation.types[0].literal?.type === 'StringLiteral'
      ) {
        return {
          type: 'StringEnumTypeAnnotation',
          default: (defaultValue: string),
          options: typeAnnotation.types.map(option => option.literal.value),
        };
      } else if (
        unionType === 'TSLiteralType' &&
        typeAnnotation.types[0].literal?.type === 'NumericLiteral'
      ) {
        throw new Error(
          `Arrays of int enums are not supported (see: "${name}")`,
        );
      } else {
        throw new Error(
          `Unsupported union type for "${name}", received "${
            unionType === 'TSLiteralType'
              ? typeAnnotation.types[0].literal?.type
              : unionType
          }"`,
        );
      }
    default:
      (type: empty);
      throw new Error(`Unknown prop type for "${name}": ${type}`);
  }
}

function getTypeAnnotation<T>(
  name: string,
  annotation: $FlowFixMe | ASTNode,
  defaultValue: $FlowFixMe | null,
  withNullDefault: boolean,
  types: TypeDeclarationMap,
  buildSchema: (property: PropAST, types: TypeDeclarationMap) => ?NamedShape<T>,
): $FlowFixMe {
  const typeAnnotation = getValueFromTypes(annotation, types);

  // Covers: (T)
  if (typeAnnotation.type === 'TSParenthesizedType') {
    return getTypeAnnotation(
      name,
      typeAnnotation.typeAnnotation,
      defaultValue,
      withNullDefault,
      types,
      buildSchema,
    );
  }

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

  // Covers: ReadonlyArray<T>
  if (
    typeAnnotation.type === 'TSTypeReference' &&
    typeAnnotation.typeName.name === 'ReadonlyArray'
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

  // Covers: Readonly<T[]>
  if (
    typeAnnotation.type === 'TSTypeReference' &&
    typeAnnotation.typeName?.name === 'Readonly' &&
    typeAnnotation.typeParameters.type === 'TSTypeParameterInstantiation' &&
    typeAnnotation.typeParameters.params[0].type === 'TSArrayType'
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

  // Covers: Readonly<T>, Readonly<{ ... }>, Readonly<T | U ...>
  if (
    typeAnnotation.type === 'TSTypeReference' &&
    typeAnnotation.typeName?.name === 'Readonly' &&
    typeAnnotation.typeParameters.type === 'TSTypeParameterInstantiation'
  ) {
    // TODO:
    // the original implementation assume Readonly<TSUnionType>
    // to be Readonly<{ ... } | null | undefined>
    // without actually verifying it
    let elementType = typeAnnotation.typeParameters.params[0];
    if (elementType.type === 'TSUnionType') {
      elementType = elementType.types[0];
    }
    return getTypeAnnotation(
      name,
      elementType,
      defaultValue,
      withNullDefault,
      types,
      buildSchema,
    );
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
        default: withNullDefault
          ? (defaultValue: number | null)
          : ((defaultValue ? defaultValue : 0): number),
      };
    case 'TSBooleanKeyword':
      return {
        type: 'BooleanTypeAnnotation',
        default: withNullDefault
          ? (defaultValue: boolean | null)
          : ((defaultValue == null ? false : defaultValue): boolean),
      };
    case 'TSStringKeyword':
      if (typeof defaultValue !== 'undefined') {
        return {
          type: 'StringTypeAnnotation',
          default: (defaultValue: string | null),
        };
      }
      throw new Error(`A default string (or null) is required for "${name}"`);
    case 'Stringish':
      if (typeof defaultValue !== 'undefined') {
        return {
          type: 'StringTypeAnnotation',
          default: (defaultValue: string | null),
        };
      }
      throw new Error(`A default string (or null) is required for "${name}"`);
    case 'TSUnionType':
      typeAnnotation.types.reduce((lastType, currType) => {
        const lastFlattenedType =
          lastType && lastType.type === 'TSLiteralType'
            ? lastType.literal.type
            : lastType.type;
        const currFlattenedType =
          currType.type === 'TSLiteralType'
            ? currType.literal.type
            : currType.type;

        if (lastFlattenedType && currFlattenedType !== lastFlattenedType) {
          throw new Error(`Mixed types are not supported (see "${name}")`);
        }
        return currType;
      });

      if (defaultValue === null) {
        throw new Error(`A default enum value is required for "${name}"`);
      }

      const unionType = typeAnnotation.types[0].type;
      if (
        unionType === 'TSLiteralType' &&
        typeAnnotation.types[0].literal?.type === 'StringLiteral'
      ) {
        return {
          type: 'StringEnumTypeAnnotation',
          default: (defaultValue: string),
          options: typeAnnotation.types.map(option => option.literal.value),
        };
      } else if (
        unionType === 'TSLiteralType' &&
        typeAnnotation.types[0].literal?.type === 'NumericLiteral'
      ) {
        return {
          type: 'Int32EnumTypeAnnotation',
          default: (defaultValue: number),
          options: typeAnnotation.types.map(option => option.literal.value),
        };
      } else {
        throw new Error(
          `Unsupported union type for "${name}", received "${
            unionType === 'TSLiteralType'
              ? typeAnnotation.types[0].literal?.type
              : unionType
          }"`,
        );
      }
    case 'TSNumberKeyword':
      throw new Error(
        `Cannot use "${type}" type annotation for "${name}": must use a specific numeric type like Int32, Double, or Float`,
      );
    default:
      (type: empty);
      throw new Error(`Unknown prop type for "${name}": "${type}"`);
  }
}

function findProp(
  name: string,
  typeAnnotation: $FlowFixMe,
  optionalType: boolean,
) {
  switch (typeAnnotation.type) {
    // Check for (T)
    case 'TSParenthesizedType':
      return findProp(name, typeAnnotation.typeAnnotation, optionalType);

    // Check for optional type in union e.g. T | null | undefined
    case 'TSUnionType':
      return findProp(
        name,
        typeAnnotation.types.filter(
          t => t.type !== 'TSNullKeyword' && t.type !== 'TSUndefinedKeyword',
        )[0],
        optionalType ||
          typeAnnotation.types.some(
            t => t.type === 'TSNullKeyword' || t.type === 'TSUndefinedKeyword',
          ),
      );

    case 'TSTypeReference':
      // Check against optional type inside `WithDefault`
      if (typeAnnotation.typeName.name === 'WithDefault' && optionalType) {
        throw new Error(
          'WithDefault<> is optional and does not need to be marked as optional. Please remove the union of undefined and/or null',
        );
      }
      // Remove unwanted types
      if (
        typeAnnotation.typeName.name === 'DirectEventHandler' ||
        typeAnnotation.typeName.name === 'BubblingEventHandler'
      ) {
        return null;
      }
      if (
        name === 'style' &&
        typeAnnotation.type === 'GenericTypeAnnotation' &&
        typeAnnotation.typeName.name === 'ViewStyleProp'
      ) {
        return null;
      }
      return {typeAnnotation, optionalType};
    default:
      return {typeAnnotation, optionalType};
  }
}

type SchemaInfo = {
  name: string,
  optional: boolean,
  typeAnnotation: $FlowFixMe,
  defaultValue: $FlowFixMe,
  withNullDefault: boolean,
};

function getSchemaInfo(
  property: PropAST,
  types: TypeDeclarationMap,
): ?SchemaInfo {
  const name = property.key.name;

  const value = getValueFromTypes(
    property.typeAnnotation.typeAnnotation,
    types,
  );

  const foundProp = findProp(name, value, false);
  if (!foundProp) {
    return null;
  }
  let {typeAnnotation, optionalType} = foundProp;
  let optional = property.optional || optionalType;

  // example: Readonly<{prop: string} | null | undefined>;
  if (
    value.type === 'TSTypeReference' &&
    typeAnnotation.typeParameters?.params[0].type === 'TSUnionType' &&
    typeAnnotation.typeParameters?.params[0].types.some(
      element =>
        element.type === 'TSNullKeyword' ||
        element.type === 'TSUndefinedKeyword',
    )
  ) {
    optional = true;
  }

  if (
    !property.optional &&
    value.type === 'TSTypeReference' &&
    typeAnnotation.typeName.name === 'WithDefault'
  ) {
    throw new Error(
      `key ${name} must be optional if used with WithDefault<> annotation`,
    );
  }

  let type = typeAnnotation.type;
  let defaultValue = null;
  let withNullDefault = false;
  if (
    type === 'TSTypeReference' &&
    typeAnnotation.typeName.name === 'WithDefault'
  ) {
    if (typeAnnotation.typeParameters.params.length === 1) {
      throw new Error(
        `WithDefault requires two parameters, did you forget to provide a default value for "${name}"?`,
      );
    }

    let defaultValueType = typeAnnotation.typeParameters.params[1].type;
    defaultValue = typeAnnotation.typeParameters.params[1].value;

    if (defaultValueType === 'TSLiteralType') {
      defaultValueType = typeAnnotation.typeParameters.params[1].literal.type;
      defaultValue = typeAnnotation.typeParameters.params[1].literal.value;
      if (
        defaultValueType === 'UnaryExpression' &&
        typeAnnotation.typeParameters.params[1].literal.argument.type ===
          'NumericLiteral' &&
        typeAnnotation.typeParameters.params[1].literal.operator === '-'
      ) {
        defaultValue =
          -1 * typeAnnotation.typeParameters.params[1].literal.argument.value;
      }
    }

    if (defaultValueType === 'TSNullKeyword') {
      defaultValue = null;
      withNullDefault = true;
    }

    typeAnnotation = typeAnnotation.typeParameters.params[0];
    type =
      typeAnnotation.type === 'TSTypeReference'
        ? typeAnnotation.typeName.name
        : typeAnnotation.type;
  }

  return {
    name,
    optional,
    typeAnnotation,
    defaultValue,
    withNullDefault,
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
