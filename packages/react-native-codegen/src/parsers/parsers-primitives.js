/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {
  Nullable,
  BooleanTypeAnnotation,
  DoubleTypeAnnotation,
  Int32TypeAnnotation,
  NativeModuleAliasMap,
  NativeModuleEnumMap,
  NativeModuleBaseTypeAnnotation,
  NativeModuleTypeAnnotation,
  NativeModuleFloatTypeAnnotation,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleGenericObjectTypeAnnotation,
  NativeModuleMixedTypeAnnotation,
  NativeModuleNumberTypeAnnotation,
  NativeModulePromiseTypeAnnotation,
  NativeModuleTypeAliasTypeAnnotation,
  NativeModuleUnionTypeAnnotation,
  ObjectTypeAnnotation,
  ReservedTypeAnnotation,
  StringTypeAnnotation,
  VoidTypeAnnotation,
  NativeModuleObjectTypeAnnotation,
  NativeModuleEnumDeclaration,
} from '../CodegenSchema';
import type {Parser} from './parser';
import type {
  ParserErrorCapturer,
  TypeResolutionStatus,
  TypeDeclarationMap,
} from './utils';

const {
  UnsupportedUnionTypeAnnotationParserError,
  UnsupportedTypeAnnotationParserError,
  ParserError,
} = require('./errors');

const {
  throwIfArrayElementTypeAnnotationIsUnsupported,
  throwIfPartialNotAnnotatingTypeParameter,
  throwIfPartialWithMoreParameter,
} = require('./error-utils');
const {nullGuard} = require('./parsers-utils');
const {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  wrapNullable,
  unwrapNullable,
  translateFunctionTypeAnnotation,
} = require('./parsers-commons');

const {isModuleRegistryCall} = require('./utils');

function emitBoolean(nullable: boolean): Nullable<BooleanTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'BooleanTypeAnnotation',
  });
}

function emitInt32(nullable: boolean): Nullable<Int32TypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'Int32TypeAnnotation',
  });
}

function emitNumber(
  nullable: boolean,
): Nullable<NativeModuleNumberTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'NumberTypeAnnotation',
  });
}

function emitRootTag(nullable: boolean): Nullable<ReservedTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'ReservedTypeAnnotation',
    name: 'RootTag',
  });
}

function emitDouble(nullable: boolean): Nullable<DoubleTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'DoubleTypeAnnotation',
  });
}

function emitVoid(nullable: boolean): Nullable<VoidTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'VoidTypeAnnotation',
  });
}

function emitStringish(nullable: boolean): Nullable<StringTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'StringTypeAnnotation',
  });
}

function emitFunction(
  nullable: boolean,
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  translateTypeAnnotation: $FlowFixMe,
  parser: Parser,
): Nullable<NativeModuleFunctionTypeAnnotation> {
  const translateFunctionTypeAnnotationValue: NativeModuleFunctionTypeAnnotation =
    translateFunctionTypeAnnotation(
      hasteModuleName,
      typeAnnotation,
      types,
      aliasMap,
      enumMap,
      tryParse,
      cxxOnly,
      translateTypeAnnotation,
      parser,
    );
  return wrapNullable(nullable, translateFunctionTypeAnnotationValue);
}

function emitMixed(
  nullable: boolean,
): Nullable<NativeModuleMixedTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'MixedTypeAnnotation',
  });
}

function emitString(nullable: boolean): Nullable<StringTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'StringTypeAnnotation',
  });
}

function typeAliasResolution(
  typeResolution: TypeResolutionStatus,
  objectTypeAnnotation: ObjectTypeAnnotation<
    Nullable<NativeModuleBaseTypeAnnotation>,
  >,
  aliasMap: {...NativeModuleAliasMap},
  nullable: boolean,
):
  | Nullable<NativeModuleTypeAliasTypeAnnotation>
  | Nullable<ObjectTypeAnnotation<Nullable<NativeModuleBaseTypeAnnotation>>> {
  if (!typeResolution.successful) {
    return wrapNullable(nullable, objectTypeAnnotation);
  }

  /**
   * All aliases RHS are required.
   */
  aliasMap[typeResolution.name] = objectTypeAnnotation;

  /**
   * Nullability of type aliases is transitive.
   *
   * Consider this case:
   *
   * type Animal = ?{
   *   name: string,
   * };
   *
   * type B = Animal
   *
   * export interface Spec extends TurboModule {
   *   +greet: (animal: B) => void;
   * }
   *
   * In this case, we follow B to Animal, and then Animal to ?{name: string}.
   *
   * We:
   *   1. Replace `+greet: (animal: B) => void;` with `+greet: (animal: ?Animal) => void;`,
   *   2. Pretend that Animal = {name: string}.
   *
   * Why do we do this?
   *  1. In ObjC, we need to generate a struct called Animal, not B.
   *  2. This design is simpler than managing nullability within both the type alias usage, and the type alias RHS.
   *  3. What does it mean for a C++ struct, which is what this type alias RHS will generate, to be nullable? ¯\_(ツ)_/¯
   *     Nullability is a concept that only makes sense when talking about instances (i.e: usages) of the C++ structs.
   *     Hence, it's better to manage nullability within the actual TypeAliasTypeAnnotation nodes, and not the
   *     associated ObjectTypeAnnotations.
   */
  return wrapNullable(nullable, {
    type: 'TypeAliasTypeAnnotation',
    name: typeResolution.name,
  });
}

function typeEnumResolution(
  typeAnnotation: $FlowFixMe,
  typeResolution: TypeResolutionStatus,
  nullable: boolean,
  hasteModuleName: string,
  enumMap: {...NativeModuleEnumMap},
  parser: Parser,
): Nullable<NativeModuleEnumDeclaration> {
  if (!typeResolution.successful || typeResolution.type !== 'enum') {
    throw new UnsupportedTypeAnnotationParserError(
      hasteModuleName,
      typeAnnotation,
      parser.language(),
    );
  }

  const enumName = typeResolution.name;

  const enumMemberType = parser.parseEnumMembersType(typeAnnotation);

  try {
    parser.validateEnumMembersSupported(typeAnnotation, enumMemberType);
  } catch (e) {
    if (e instanceof Error) {
      throw new ParserError(
        hasteModuleName,
        typeAnnotation,
        `Failed parsing the enum ${enumName} in ${hasteModuleName} with the error: ${e.message}`,
      );
    } else {
      throw e;
    }
  }

  const enumMembers = parser.parseEnumMembers(typeAnnotation);

  enumMap[enumName] = {
    name: enumName,
    type: 'EnumDeclarationWithMembers',
    memberType: enumMemberType,
    members: enumMembers,
  };

  return wrapNullable(nullable, {
    name: enumName,
    type: 'EnumDeclaration',
    memberType: enumMemberType,
  });
}

function emitPromise(
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  parser: Parser,
  nullable: boolean,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  translateTypeAnnotation: $FlowFixMe,
): Nullable<NativeModulePromiseTypeAnnotation> {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter(
    hasteModuleName,
    typeAnnotation,
    parser,
  );

  const elementType = typeAnnotation.typeParameters.params[0];
  if (
    elementType.type === 'ExistsTypeAnnotation' ||
    elementType.type === 'EmptyTypeAnnotation'
  ) {
    return wrapNullable(nullable, {
      type: 'PromiseTypeAnnotation',
    });
  } else {
    try {
      return wrapNullable(nullable, {
        type: 'PromiseTypeAnnotation',
        elementType: translateTypeAnnotation(
          hasteModuleName,
          typeAnnotation.typeParameters.params[0],
          types,
          aliasMap,
          enumMap,
          tryParse,
          cxxOnly,
          parser,
        ),
      });
    } catch {
      return wrapNullable(nullable, {
        type: 'PromiseTypeAnnotation',
      });
    }
  }
}

function emitGenericObject(
  nullable: boolean,
): Nullable<NativeModuleGenericObjectTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'GenericObjectTypeAnnotation',
  });
}

function emitObject(
  nullable: boolean,
  properties: Array<$FlowFixMe>,
): Nullable<NativeModuleObjectTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'ObjectTypeAnnotation',
    properties,
  });
}

function emitFloat(
  nullable: boolean,
): Nullable<NativeModuleFloatTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'FloatTypeAnnotation',
  });
}

function emitUnion(
  nullable: boolean,
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  parser: Parser,
): Nullable<NativeModuleUnionTypeAnnotation> {
  const unionTypes = parser.remapUnionTypeAnnotationMemberNames(
    typeAnnotation.types,
  );

  // Only support unionTypes of the same kind
  if (unionTypes.length > 1) {
    throw new UnsupportedUnionTypeAnnotationParserError(
      hasteModuleName,
      typeAnnotation,
      unionTypes,
    );
  }

  return wrapNullable(nullable, {
    type: 'UnionTypeAnnotation',
    memberType: unionTypes[0],
  });
}

function translateArrayTypeAnnotation(
  hasteModuleName: string,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  cxxOnly: boolean,
  arrayType: 'Array' | 'ReadonlyArray',
  elementType: $FlowFixMe,
  nullable: boolean,
  translateTypeAnnotation: $FlowFixMe,
  parser: Parser,
): Nullable<NativeModuleTypeAnnotation> {
  try {
    /**
     * TODO(T72031674): Migrate all our NativeModule specs to not use
     * invalid Array ElementTypes. Then, make the elementType a required
     * parameter.
     */
    const [_elementType, isElementTypeNullable] = unwrapNullable<$FlowFixMe>(
      translateTypeAnnotation(
        hasteModuleName,
        elementType,
        types,
        aliasMap,
        enumMap,
        /**
         * TODO(T72031674): Ensure that all ParsingErrors that are thrown
         * while parsing the array element don't get captured and collected.
         * Why? If we detect any parsing error while parsing the element,
         * we should default it to null down the line, here. This is
         * the correct behaviour until we migrate all our NativeModule specs
         * to be parseable.
         */
        nullGuard,
        cxxOnly,
        parser,
      ),
    );

    throwIfArrayElementTypeAnnotationIsUnsupported(
      hasteModuleName,
      elementType,
      arrayType,
      _elementType.type,
    );

    return wrapNullable(nullable, {
      type: 'ArrayTypeAnnotation',
      // $FlowFixMe[incompatible-call]
      elementType: wrapNullable(isElementTypeNullable, _elementType),
    });
  } catch (ex) {
    return wrapNullable(nullable, {
      type: 'ArrayTypeAnnotation',
    });
  }
}

function emitArrayType(
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  parser: Parser,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  cxxOnly: boolean,
  nullable: boolean,
  translateTypeAnnotation: $FlowFixMe,
): Nullable<NativeModuleTypeAnnotation> {
  assertGenericTypeAnnotationHasExactlyOneTypeParameter(
    hasteModuleName,
    typeAnnotation,
    parser,
  );

  return translateArrayTypeAnnotation(
    hasteModuleName,
    types,
    aliasMap,
    enumMap,
    cxxOnly,
    typeAnnotation.type,
    typeAnnotation.typeParameters.params[0],
    nullable,
    translateTypeAnnotation,
    parser,
  );
}

function Visitor(infoMap: {isComponent: boolean, isModule: boolean}): {
  [type: string]: (node: $FlowFixMe) => void,
} {
  return {
    CallExpression(node: $FlowFixMe) {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'codegenNativeComponent'
      ) {
        infoMap.isComponent = true;
      }

      if (isModuleRegistryCall(node)) {
        infoMap.isModule = true;
      }
    },
    InterfaceExtends(node: $FlowFixMe) {
      if (node.id.name === 'TurboModule') {
        infoMap.isModule = true;
      }
    },
    TSInterfaceDeclaration(node: $FlowFixMe) {
      if (
        Array.isArray(node.extends) &&
        node.extends.some(
          extension => extension.expression.name === 'TurboModule',
        )
      ) {
        infoMap.isModule = true;
      }
    },
  };
}

function emitPartial(
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  nullable: boolean,
  parser: Parser,
): Nullable<NativeModuleTypeAnnotation> {
  throwIfPartialWithMoreParameter(typeAnnotation);

  throwIfPartialNotAnnotatingTypeParameter(typeAnnotation, types, parser);

  const annotatedElement = parser.extractAnnotatedElement(
    typeAnnotation,
    types,
  );
  const annotatedElementProperties =
    parser.getAnnotatedElementProperties(annotatedElement);

  const partialProperties = parser.computePartialProperties(
    annotatedElementProperties,
    hasteModuleName,
    types,
    aliasMap,
    enumMap,
    tryParse,
    cxxOnly,
  );

  return emitObject(nullable, partialProperties);
}

function emitCommonTypes(
  hasteModuleName: string,
  types: TypeDeclarationMap,
  typeAnnotation: $FlowFixMe,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  nullable: boolean,
  parser: Parser,
): $FlowFixMe {
  const genericTypeAnnotationName =
    parser.nameForGenericTypeAnnotation(typeAnnotation);

  switch (genericTypeAnnotationName) {
    case 'Stringish': {
      return emitStringish(nullable);
    }
    case 'Int32': {
      return emitInt32(nullable);
    }
    case 'Double': {
      return emitDouble(nullable);
    }
    case 'Float': {
      return emitFloat(nullable);
    }
    case 'UnsafeObject':
    case 'Object': {
      return emitGenericObject(nullable);
    }
    case '$Partial':
    case 'Partial': {
      return emitPartial(
        hasteModuleName,
        typeAnnotation,
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        nullable,
        parser,
      );
    }
    default: {
      return null;
    }
  }
}

module.exports = {
  emitArrayType,
  emitBoolean,
  emitDouble,
  emitFloat,
  emitFunction,
  emitInt32,
  emitNumber,
  emitGenericObject,
  emitObject,
  emitPromise,
  emitRootTag,
  emitVoid,
  emitString,
  emitStringish,
  emitMixed,
  emitUnion,
  emitPartial,
  emitCommonTypes,
  typeAliasResolution,
  typeEnumResolution,
  translateArrayTypeAnnotation,
  Visitor,
};
