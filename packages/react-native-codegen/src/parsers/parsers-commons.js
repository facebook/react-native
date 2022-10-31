/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {
  SchemaType,
  NativeModuleSchema,
  NativeModuleTypeAnnotation,
  Nullable,
  NativeModuleMixedTypeAnnotation,
  UnionTypeAnnotationMemberType,
  NativeModuleUnionTypeAnnotation,
} from '../CodegenSchema.js';
const {
  IncorrectlyParameterizedGenericParserError,
  UnsupportedUnionTypeAnnotationParserError,
} = require('./errors');
import type {ParserType} from './errors';

const invariant = require('invariant');
const {
  getTypes,
  isModuleRegistryCall,
  resolveTypeAnnotation,
} = require('./flow/utils');
const {
  throwIfIncorrectModuleRegistryCallTypeParameterParserError,
  throwIfModuleInterfaceIsMisnamed,
  throwIfModuleInterfaceNotFound,
  throwIfModuleTypeIsUnsupported,
  throwIfMoreThanOneModuleInterfaceParserError,
  throwIfMoreThanOneModuleRegistryCalls,
  throwIfUnsupportedFunctionReturnTypeAnnotationParserError,
  throwIfUntypedModule,
  throwIfUnusedModuleInterfaceParserError,
  throwIfWrongNumberOfCallExpressionArgs,
} = require('./error-utils');
const {verifyPlatforms, visit} = require('./utils');
const {
  IncorrectModuleRegistryCallArgumentTypeParserError,
  UnnamedFunctionParamParserError,
  UnsupportedFunctionParamTypeAnnotationParserError,
} = require('./errors');
import type {
  NamedShape,
  NativeModuleAliasMap,
  NativeModuleArrayTypeAnnotation,
  NativeModuleBaseTypeAnnotation,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleParamTypeAnnotation,
  NativeModulePropertyShape,
} from '../CodegenSchema';
import type {ParserErrorCapturer, TypeDeclarationMap} from './utils';
import {
  UnsupportedArrayElementTypeAnnotationParserError,
  UnsupportedEnumDeclarationParserError,
  UnsupportedGenericParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError,
  UnsupportedTypeAnnotationParserError,
} from './errors';
import {
  emitBoolean,
  emitDouble,
  emitFunction,
  emitInt32,
  emitNumber,
  emitObject,
  emitPromise,
  emitRootTag,
  emitString,
  emitStringish,
  emitVoid,
  typeAliasResolution,
} from './parsers-primitives';
import {throwIfPropertyValueTypeIsUnsupported} from './error-utils';
import {nullGuard} from './parsers-utils';
import type {Parser} from './parser';

function wrapModuleSchema(
  nativeModuleSchema: NativeModuleSchema,
  hasteModuleName: string,
): SchemaType {
  return {
    modules: {
      [hasteModuleName]: nativeModuleSchema,
    },
  };
}

function unwrapNullable<+T: NativeModuleTypeAnnotation>(
  x: Nullable<T>,
): [T, boolean] {
  if (x.type === 'NullableTypeAnnotation') {
    return [x.typeAnnotation, true];
  }

  return [x, false];
}

function wrapNullable<+T: NativeModuleTypeAnnotation>(
  nullable: boolean,
  typeAnnotation: T,
): Nullable<T> {
  if (!nullable) {
    return typeAnnotation;
  }

  return {
    type: 'NullableTypeAnnotation',
    typeAnnotation,
  };
}

function assertGenericTypeAnnotationHasExactlyOneTypeParameter(
  moduleName: string,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  typeAnnotation: $FlowFixMe,
  language: ParserType,
) {
  if (typeAnnotation.typeParameters == null) {
    throw new IncorrectlyParameterizedGenericParserError(
      moduleName,
      typeAnnotation,
      language,
    );
  }

  const typeAnnotationType =
    language === 'TypeScript'
      ? 'TSTypeParameterInstantiation'
      : 'TypeParameterInstantiation';

  invariant(
    typeAnnotation.typeParameters.type === typeAnnotationType,
    `assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type '${typeAnnotationType}'`,
  );

  if (typeAnnotation.typeParameters.params.length !== 1) {
    throw new IncorrectlyParameterizedGenericParserError(
      moduleName,
      typeAnnotation,
      language,
    );
  }
}

function emitMixedTypeAnnotation(
  nullable: boolean,
): Nullable<NativeModuleMixedTypeAnnotation> {
  return wrapNullable(nullable, {
    type: 'MixedTypeAnnotation',
  });
}

function remapUnionTypeAnnotationMemberNames(
  types: $FlowFixMe,
  language: ParserType,
): UnionTypeAnnotationMemberType[] {
  const remapLiteral = (item: $FlowFixMe) => {
    if (language === 'Flow') {
      return item.type
        .replace('NumberLiteralTypeAnnotation', 'NumberTypeAnnotation')
        .replace('StringLiteralTypeAnnotation', 'StringTypeAnnotation');
    }

    return item.literal
      ? item.literal.type
          .replace('NumericLiteral', 'NumberTypeAnnotation')
          .replace('StringLiteral', 'StringTypeAnnotation')
      : 'ObjectTypeAnnotation';
  };

  return types
    .map(remapLiteral)
    .filter((value, index, self) => self.indexOf(value) === index);
}

function emitUnionTypeAnnotation(
  nullable: boolean,
  hasteModuleName: string,
  typeAnnotation: $FlowFixMe,
  language: ParserType,
): Nullable<NativeModuleUnionTypeAnnotation> {
  const unionTypes = remapUnionTypeAnnotationMemberNames(
    typeAnnotation.types,
    language,
  );

  // Only support unionTypes of the same kind
  if (unionTypes.length > 1) {
    throw new UnsupportedUnionTypeAnnotationParserError(
      hasteModuleName,
      typeAnnotation,
      unionTypes,
      language,
    );
  }

  return wrapNullable(nullable, {
    type: 'UnionTypeAnnotation',
    memberType: unionTypes[0],
  });
}

function buildModuleSchema(
  hasteModuleName: string,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  ast: $FlowFixMe,
  tryParse: ParserErrorCapturer,
  language: ParserType,
  parser: Parser,
): NativeModuleSchema {
  const types = getTypes(ast);

  const moduleSpecs = (Object.values(types): $ReadOnlyArray<$FlowFixMe>).filter(
    //$FlowFixMe
    isModuleInterface,
  );

  throwIfModuleInterfaceNotFound(
    moduleSpecs.length,
    hasteModuleName,
    ast,
    language,
  );

  throwIfMoreThanOneModuleInterfaceParserError(
    hasteModuleName,
    moduleSpecs,
    language,
  );

  const [moduleSpec] = moduleSpecs;

  throwIfModuleInterfaceIsMisnamed(hasteModuleName, moduleSpec.id, language);

  // Parse Module Names
  const moduleName = tryParse((): string => {
    const callExpressions = [];
    visit(ast, {
      CallExpression(node) {
        if (isModuleRegistryCall(node)) {
          callExpressions.push(node);
        }
      },
    });

    throwIfUnusedModuleInterfaceParserError(
      hasteModuleName,
      moduleSpec,
      callExpressions,
      language,
    );

    throwIfMoreThanOneModuleRegistryCalls(
      hasteModuleName,
      callExpressions,
      callExpressions.length,
      language,
    );

    const [callExpression] = callExpressions;
    const typeParams =
      language === 'TypeScript'
        ? callExpression.typeParameters
        : callExpression.typeArguments;
    const methodName = callExpression.callee.property.name;
    const callExpressionArgumentType =
      language === 'TypeScript' ? 'StringLiteral' : 'Literal';

    throwIfWrongNumberOfCallExpressionArgs(
      hasteModuleName,
      callExpression,
      methodName,
      callExpression.arguments.length,
      language,
    );

    if (callExpression.arguments[0].type !== callExpressionArgumentType) {
      const {type} = callExpression.arguments[0];
      throw new IncorrectModuleRegistryCallArgumentTypeParserError(
        hasteModuleName,
        callExpression.arguments[0],
        methodName,
        type,
        language,
      );
    }

    const $moduleName = callExpression.arguments[0].value;

    throwIfUntypedModule(
      typeParams,
      hasteModuleName,
      callExpression,
      methodName,
      $moduleName,
      language,
    );

    throwIfIncorrectModuleRegistryCallTypeParameterParserError(
      hasteModuleName,
      typeParams,
      methodName,
      $moduleName,
      language,
    );

    return $moduleName;
  });

  const moduleNames = moduleName == null ? [] : [moduleName];

  // Some module names use platform suffix to indicate platform-exclusive modules.
  // Eventually this should be made explicit in the Flow type itself.
  // Also check the hasteModuleName for platform suffix.
  // Note: this shape is consistent with ComponentSchema.
  const {cxxOnly, excludedPlatforms} = verifyPlatforms(
    hasteModuleName,
    moduleNames,
  );

  let filteredModuleSpec;
  if (language === 'TypeScript') {
    filteredModuleSpec = moduleSpec.body.body.filter(
      property =>
        property.type === 'TSMethodSignature' ||
        property.type === 'TSPropertySignature',
    );
  } else {
    filteredModuleSpec = moduleSpec.body.properties.filter(
      property => property.type === 'ObjectTypeProperty',
    );
  }

  // $FlowFixMe[missing-type-arg]
  return filteredModuleSpec
    .map<?{
      aliasMap: NativeModuleAliasMap,
      propertyShape: NativeModulePropertyShape,
    }>(property => {
      const aliasMap: {...NativeModuleAliasMap} = {};

      return tryParse(() => ({
        aliasMap: aliasMap,
        // $FlowFixMe
        propertyShape: buildPropertySchema(
          hasteModuleName,
          property,
          types,
          aliasMap,
          tryParse,
          cxxOnly,
          language,
          parser,
        ),
      }));
    })
    .filter(Boolean)
    .reduce(
      (moduleSchema: NativeModuleSchema, {aliasMap, propertyShape}) => {
        return {
          type: 'NativeModule',
          aliases: {...moduleSchema.aliases, ...aliasMap},
          spec: {
            properties: [...moduleSchema.spec.properties, propertyShape],
          },
          moduleNames: moduleSchema.moduleNames,
          excludedPlatforms: moduleSchema.excludedPlatforms,
        };
      },
      {
        type: 'NativeModule',
        aliases: {},
        spec: {properties: []},
        moduleNames: moduleNames,
        excludedPlatforms:
          excludedPlatforms.length !== 0 ? [...excludedPlatforms] : undefined,
      },
    );
}

module.exports = {
  wrapModuleSchema,
  unwrapNullable,
  wrapNullable,
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  emitMixedTypeAnnotation,
  emitUnionTypeAnnotation,
  buildModuleSchema,
};
