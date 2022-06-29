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

const {getValueFromTypes} = require('../utils.js');

import type {NamedShape, PropTypeAnnotation} from '../../../CodegenSchema.js';
import type {TypeDeclarationMap} from '../utils.js';

function getPropProperties(
  propsTypeName: string,
  types: TypeDeclarationMap,
): $FlowFixMe {
  const alias = types[propsTypeName];
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
      `Failed to find ${aliasKind} definition for "${propsTypeName}", please check that you have a valid codegen typescript file`,
    );
  }
}

function getTypeAnnotationForArray(
  name: string,
  typeAnnotation: $FlowFixMe,
  defaultValue: $FlowFixMe | null,
  types: TypeDeclarationMap,
) {
  const extractedTypeAnnotation = getValueFromTypes(typeAnnotation, types);

  if (
    extractedTypeAnnotation.type === 'TSUnionType' &&
    extractedTypeAnnotation.types.some(
      t => t.type === 'TSNullKeyword' || t.type === 'TSVoidKeyword',
    )
  ) {
    throw new Error(
      'Nested optionals such as "ReadonlyArray<boolean | null | void>" are not supported, please declare optionals at the top level of value definitions as in "ReadonlyArray<boolean> | null | void"',
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

  if (extractedTypeAnnotation.type === 'TSTypeReference') {
    // Resolve the type alias if it's not defined inline
    const objectType = getValueFromTypes(extractedTypeAnnotation, types);

    if (objectType.typeName.name === 'Readonly') {
      return {
        type: 'ObjectTypeAnnotation',
        properties: flattenProperties(
          objectType.typeParameters.params[0].members ||
            objectType.typeParameters.params,
          types,
        )
          .map(prop => buildPropSchema(prop, types))
          .filter(Boolean),
      };
    }

    if (objectType.typeName.name === 'ReadonlyArray') {
      // We need to go yet another level deeper to resolve
      // types that may be defined in a type alias
      const nestedObjectType = getValueFromTypes(
        objectType.typeParameters.params[0],
        types,
      );

      return {
        type: 'ArrayTypeAnnotation',
        elementType: {
          type: 'ObjectTypeAnnotation',
          properties: flattenProperties(
            nestedObjectType.typeParameters.params[0].members ||
              nestedObjectType.typeParameters.params,
            types,
          )
            .map(prop => buildPropSchema(prop, types))
            .filter(Boolean),
        },
      };
    }
  }

  const type =
    extractedTypeAnnotation.elementType === 'TSTypeReference'
      ? extractedTypeAnnotation.elementType.typeName.name
      : extractedTypeAnnotation.elementType?.type ||
        extractedTypeAnnotation.typeName?.name ||
        extractedTypeAnnotation.type;

  switch (type) {
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

function getTypeAnnotation(
  name: string,
  annotation: $FlowFixMe | ASTNode,
  defaultValue: $FlowFixMe | null,
  withNullDefault: boolean,
  types: TypeDeclarationMap,
) {
  const typeAnnotation = getValueFromTypes(annotation, types);

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
        typeAnnotation.typeAnnotation,
        defaultValue,
        types,
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
      ),
    };
  }

  if (
    (typeAnnotation.type === 'TSTypeReference' ||
      typeAnnotation.type === 'TSTypeLiteral') &&
    typeAnnotation.typeName?.name === 'Readonly'
  ) {
    const rawProperties =
      typeAnnotation.typeParameters.params[0].members ||
      (typeAnnotation.typeParameters.params[0].types &&
        typeAnnotation.typeParameters.params[0].types[0].members) ||
      typeAnnotation.typeParameters.params;

    const flattenedProperties = flattenProperties(rawProperties, types);

    const properties = flattenedProperties
      .map(prop => buildPropSchema(prop, types))
      .filter(Boolean);

    return {
      type: 'ObjectTypeAnnotation',
      properties,
    };
  }

  const type =
    typeAnnotation.type === 'TSTypeReference' ||
    typeAnnotation.type === 'TSTypeAliasDeclaration'
      ? typeAnnotation.typeName.name
      : typeAnnotation.type;

  switch (type) {
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

function buildPropSchema(
  property: PropAST,
  types: TypeDeclarationMap,
): ?NamedShape<PropTypeAnnotation> {
  const name = property.key.name;

  const value = getValueFromTypes(
    property.typeAnnotation.typeAnnotation,
    types,
  );

  let typeAnnotation = value;
  let optional = property.optional || false;

  // Check for optional type in union e.g. T | null | void
  if (
    typeAnnotation.type === 'TSUnionType' &&
    typeAnnotation.types.some(
      t => t.type === 'TSNullKeyword' || t.type === 'TSVoidKeyword',
    )
  ) {
    typeAnnotation = typeAnnotation.types.filter(
      t => t.type !== 'TSNullKeyword' && t.type !== 'TSVoidKeyword',
    )[0];
    optional = true;

    // Check against optional type inside `WithDefault`
    if (
      typeAnnotation.type === 'TSTypeReference' &&
      typeAnnotation.typeName.name === 'WithDefault'
    ) {
      throw new Error(
        'WithDefault<> is optional and does not need to be marked as optional. Please remove the union of void and/or null',
      );
    }
  }

  // example: WithDefault<string, ''>;
  if (
    value.type === 'TSTypeReference' &&
    typeAnnotation.typeName.name === 'WithDefault'
  ) {
    optional = true;
  }

  // example: Readonly<{prop: string} | null | void>;
  if (
    value.type === 'TSTypeReference' &&
    typeAnnotation.typeParameters?.params[0].type === 'TSUnionType' &&
    typeAnnotation.typeParameters?.params[0].types.some(
      element =>
        element.type === 'TSNullKeyword' || element.type === 'TSVoidKeyword',
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
  if (
    type === 'TSTypeReference' &&
    (typeAnnotation.typeName.name === 'DirectEventHandler' ||
      typeAnnotation.typeName.name === 'BubblingEventHandler')
  ) {
    return null;
  }

  if (
    name === 'style' &&
    type === 'GenericTypeAnnotation' &&
    typeAnnotation.typeName.name === 'ViewStyleProp'
  ) {
    return null;
  }

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
    typeAnnotation: getTypeAnnotation(
      name,
      typeAnnotation,
      defaultValue,
      withNullDefault,
      types,
    ),
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
) {
  return typeDefinition
    .map(property => {
      if (property.type === 'TSPropertySignature') {
        return property;
      } else if (property.type === 'TSTypeReference') {
        return flattenProperties(
          getPropProperties(property.typeName.name, types),
          types,
        );
      } else if (property.type === 'TSExpressionWithTypeArguments') {
        return flattenProperties(
          getPropProperties(property.expression.name, types),
          types,
        );
      }
    })
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

function getProps(
  typeDefinition: $ReadOnlyArray<PropAST>,
  types: TypeDeclarationMap,
): $ReadOnlyArray<NamedShape<PropTypeAnnotation>> {
  return flattenProperties(typeDefinition, types)
    .map(property => {
      return buildPropSchema(property, types);
    })
    .filter(Boolean);
}

module.exports = {
  getProps,
  getPropProperties,
};
