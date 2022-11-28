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

import type {
  NamedShape,
  NativeModuleAliasMap,
  NativeModuleBaseTypeAnnotation,
  NativeModulePropertyShape,
  NativeModuleTypeAnnotation,
  NativeModuleSchema,
  Nullable,
} from '../../../CodegenSchema.js';

import type {ParserErrorCapturer, TypeDeclarationMap} from '../../utils';

const {nullGuard} = require('../../parsers-utils');
const {visit, isModuleRegistryCall, verifyPlatforms} = require('../../utils');
const {resolveTypeAnnotation, getTypes} = require('../utils.js');

const {
  unwrapNullable,
  wrapNullable,
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  parseObjectProperty,
  emitUnionTypeAnnotation,
  translateDefault,
  buildPropertySchema,
} = require('../../parsers-commons');

const {
  emitBoolean,
  emitDouble,
  emitFloat,
  emitFunction,
  emitNumber,
  emitInt32,
  emitObject,
  emitPromise,
  emitRootTag,
  emitVoid,
  emitString,
  emitStringish,
  emitMixedTypeAnnotation,
  typeAliasResolution,
} = require('../../parsers-primitives');

const {
  UnsupportedArrayElementTypeAnnotationParserError,
  UnsupportedGenericParserError,
  UnsupportedTypeAnnotationParserError,
  IncorrectModuleRegistryCallArgumentTypeParserError,
} = require('../../errors.js');

const {
  throwIfUntypedModule,
  throwIfUnusedModuleInterfaceParserError,
  throwIfModuleInterfaceNotFound,
  throwIfModuleInterfaceIsMisnamed,
  throwIfWrongNumberOfCallExpressionArgs,
  throwIfMoreThanOneModuleRegistryCalls,
  throwIfMoreThanOneModuleInterfaceParserError,
  throwIfIncorrectModuleRegistryCallTypeParameterParserError,
  throwIfArrayElementTypeAnnotationIsUnsupported,
} = require('../../error-utils');

const {TypeScriptParser} = require('../parser');

const language = 'TypeScript';
const parser = new TypeScriptParser();

function translateArrayTypeAnnotation(
  hasteModuleName: string,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  cxxOnly: boolean,
  tsArrayType: 'Array' | 'ReadonlyArray',
  tsElementType: $FlowFixMe,
  nullable: boolean,
): Nullable<NativeModuleTypeAnnotation> {
  try {
    /**
     * TODO(T72031674): Migrate all our NativeModule specs to not use
     * invalid Array ElementTypes. Then, make the elementType a required
     * parameter.
     */
    const [elementType, isElementTypeNullable] = unwrapNullable(
      translateTypeAnnotation(
        hasteModuleName,
        tsElementType,
        types,
        aliasMap,
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
      ),
    );

    throwIfArrayElementTypeAnnotationIsUnsupported(
      hasteModuleName,
      tsElementType,
      tsArrayType,
      elementType.type,
      language,
    );

    return wrapNullable(nullable, {
      type: 'ArrayTypeAnnotation',
      // $FlowFixMe[incompatible-call]
      elementType: wrapNullable(isElementTypeNullable, elementType),
    });
  } catch (ex) {
    return wrapNullable(nullable, {
      type: 'ArrayTypeAnnotation',
    });
  }
}

function translateTypeAnnotation(
  hasteModuleName: string,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  typeScriptTypeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
): Nullable<NativeModuleTypeAnnotation> {
  const {nullable, typeAnnotation, typeAliasResolutionStatus} =
    resolveTypeAnnotation(typeScriptTypeAnnotation, types);

  switch (typeAnnotation.type) {
    case 'TSArrayType': {
      return translateArrayTypeAnnotation(
        hasteModuleName,
        types,
        aliasMap,
        cxxOnly,
        'Array',
        typeAnnotation.elementType,
        nullable,
      );
    }
    case 'TSTypeOperator': {
      if (
        typeAnnotation.operator === 'readonly' &&
        typeAnnotation.typeAnnotation.type === 'TSArrayType'
      ) {
        return translateArrayTypeAnnotation(
          hasteModuleName,
          types,
          aliasMap,
          cxxOnly,
          'ReadonlyArray',
          typeAnnotation.typeAnnotation.elementType,
          nullable,
        );
      } else {
        throw new UnsupportedGenericParserError(
          hasteModuleName,
          typeAnnotation,
          parser,
        );
      }
    }
    case 'TSTypeReference': {
      switch (typeAnnotation.typeName.name) {
        case 'RootTag': {
          return emitRootTag(nullable);
        }
        case 'Promise': {
          return emitPromise(hasteModuleName, typeAnnotation, parser, nullable);
        }
        case 'Array':
        case 'ReadonlyArray': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            hasteModuleName,
            typeAnnotation,
            parser,
          );

          return translateArrayTypeAnnotation(
            hasteModuleName,
            types,
            aliasMap,
            cxxOnly,
            typeAnnotation.type,
            typeAnnotation.typeParameters.params[0],
            nullable,
          );
        }
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
          return emitObject(nullable);
        }
        default: {
          return translateDefault(
            hasteModuleName,
            typeAnnotation,
            types,
            nullable,
            parser,
          );
        }
      }
    }
    case 'TSTypeLiteral': {
      const objectTypeAnnotation = {
        type: 'ObjectTypeAnnotation',
        // $FlowFixMe[missing-type-arg]
        properties: (typeAnnotation.members: Array<$FlowFixMe>)
          .map<?NamedShape<Nullable<NativeModuleBaseTypeAnnotation>>>(
            property => {
              return tryParse(() => {
                return parseObjectProperty(
                  property,
                  hasteModuleName,
                  types,
                  aliasMap,
                  tryParse,
                  cxxOnly,
                  nullable,
                  translateTypeAnnotation,
                  parser,
                );
              });
            },
          )
          .filter(Boolean),
      };

      return typeAliasResolution(
        typeAliasResolutionStatus,
        objectTypeAnnotation,
        aliasMap,
        nullable,
      );
    }
    case 'TSBooleanKeyword': {
      return emitBoolean(nullable);
    }
    case 'TSNumberKeyword': {
      return emitNumber(nullable);
    }
    case 'TSVoidKeyword': {
      return emitVoid(nullable);
    }
    case 'TSStringKeyword': {
      return emitString(nullable);
    }
    case 'TSFunctionType': {
      return emitFunction(
        nullable,
        hasteModuleName,
        typeAnnotation,
        types,
        aliasMap,
        tryParse,
        cxxOnly,
        translateTypeAnnotation,
        language,
      );
    }
    case 'TSUnionType': {
      return emitUnionTypeAnnotation(
        nullable,
        hasteModuleName,
        typeAnnotation,
        parser,
      );
    }
    case 'TSUnknownKeyword': {
      if (cxxOnly) {
        return emitMixedTypeAnnotation(nullable);
      }
      // Fallthrough
    }
    default: {
      throw new UnsupportedTypeAnnotationParserError(
        hasteModuleName,
        typeAnnotation,
        language,
      );
    }
  }
}

function isModuleInterface(node: $FlowFixMe) {
  return (
    node.type === 'TSInterfaceDeclaration' &&
    node.extends?.length === 1 &&
    node.extends[0].type === 'TSExpressionWithTypeArguments' &&
    node.extends[0].expression.name === 'TurboModule'
  );
}

function buildModuleSchema(
  hasteModuleName: string,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  ast: $FlowFixMe,
  tryParse: ParserErrorCapturer,
): NativeModuleSchema {
  const types = getTypes(ast);
  const moduleSpecs = (Object.values(types): $ReadOnlyArray<$FlowFixMe>).filter(
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
    const {typeParameters} = callExpression;
    const methodName = callExpression.callee.property.name;

    throwIfWrongNumberOfCallExpressionArgs(
      hasteModuleName,
      callExpression,
      methodName,
      callExpression.arguments.length,
      language,
    );

    if (callExpression.arguments[0].type !== 'StringLiteral') {
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
      typeParameters,
      hasteModuleName,
      callExpression,
      methodName,
      $moduleName,
      language,
    );

    throwIfIncorrectModuleRegistryCallTypeParameterParserError(
      hasteModuleName,
      typeParameters,
      methodName,
      $moduleName,
      parser,
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

  // $FlowFixMe[missing-type-arg]
  return (moduleSpec.body.body: $ReadOnlyArray<$FlowFixMe>)
    .filter(
      property =>
        property.type === 'TSMethodSignature' ||
        property.type === 'TSPropertySignature',
    )
    .map<?{
      aliasMap: NativeModuleAliasMap,
      propertyShape: NativeModulePropertyShape,
    }>(property => {
      const aliasMap: {...NativeModuleAliasMap} = {};

      return tryParse(() => ({
        aliasMap: aliasMap,
        propertyShape: buildPropertySchema(
          hasteModuleName,
          property,
          types,
          aliasMap,
          tryParse,
          cxxOnly,
          language,
          resolveTypeAnnotation,
          translateTypeAnnotation,
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
  buildModuleSchema,
  typeScriptTranslateTypeAnnotation: translateTypeAnnotation,
};
