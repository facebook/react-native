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
  NativeModuleArrayTypeAnnotation,
  NativeModuleBaseTypeAnnotation,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleParamTypeAnnotation,
  NativeModulePropertyShape,
  NativeModuleSchema,
  Nullable,
} from '../../../CodegenSchema.js';

import type {ParserErrorCapturer, TypeDeclarationMap} from '../../utils';
import type {NativeModuleTypeAnnotation} from '../../../CodegenSchema.js';
const {nullGuard} = require('../../parsers-utils');

const {visit, verifyPlatforms, isModuleRegistryCall} = require('../../utils');
const {resolveTypeAnnotation, getTypes} = require('../utils.js');
const {
  unwrapNullable,
  wrapNullable,
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  parseObjectProperty,
  emitUnionTypeAnnotation,
  translateDefault,
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
  translateFunctionTypeAnnotation,
} = require('../../parsers-primitives');

const {
  UnnamedFunctionParamParserError,
  UnsupportedArrayElementTypeAnnotationParserError,
  UnsupportedTypeAnnotationParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError,
  IncorrectModuleRegistryCallArgumentTypeParserError,
} = require('../../errors.js');

const {
  throwIfUnsupportedFunctionReturnTypeAnnotationParserError,
  throwIfModuleInterfaceNotFound,
  throwIfModuleInterfaceIsMisnamed,
  throwIfUnusedModuleInterfaceParserError,
  throwIfWrongNumberOfCallExpressionArgs,
  throwIfMoreThanOneModuleRegistryCalls,
  throwIfIncorrectModuleRegistryCallTypeParameterParserError,
  throwIfUntypedModule,
  throwIfModuleTypeIsUnsupported,
  throwIfMoreThanOneModuleInterfaceParserError,
  throwIfUnsupportedFunctionParamTypeAnnotationParserError,
} = require('../../error-utils');

const {FlowParser} = require('../parser.js');

const language = 'Flow';
const parser = new FlowParser();

function translateArrayTypeAnnotation(
  hasteModuleName: string,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  cxxOnly: boolean,
  flowArrayType: 'Array' | '$ReadOnlyArray',
  flowElementType: $FlowFixMe,
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
        flowElementType,
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

    if (elementType.type === 'VoidTypeAnnotation') {
      throw new UnsupportedArrayElementTypeAnnotationParserError(
        hasteModuleName,
        flowElementType,
        flowArrayType,
        'void',
        language,
      );
    }

    if (elementType.type === 'PromiseTypeAnnotation') {
      throw new UnsupportedArrayElementTypeAnnotationParserError(
        hasteModuleName,
        flowElementType,
        flowArrayType,
        'Promise',
        language,
      );
    }

    if (elementType.type === 'FunctionTypeAnnotation') {
      throw new UnsupportedArrayElementTypeAnnotationParserError(
        hasteModuleName,
        flowElementType,
        flowArrayType,
        'FunctionTypeAnnotation',
        language,
      );
    }

    const finalTypeAnnotation: NativeModuleArrayTypeAnnotation<
      Nullable<NativeModuleBaseTypeAnnotation>,
    > = {
      type: 'ArrayTypeAnnotation',
      elementType: wrapNullable(isElementTypeNullable, elementType),
    };

    return wrapNullable(nullable, finalTypeAnnotation);
  } catch (ex) {
    return wrapNullable(nullable, {
      type: 'ArrayTypeAnnotation',
    });
  }
}

function translateTypeAnnotation(
  hasteModuleName: string,
  /**
   * TODO(T71778680): Flow-type this node.
   */
  flowTypeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
): Nullable<NativeModuleTypeAnnotation> {
  const {nullable, typeAnnotation, typeAliasResolutionStatus} =
    resolveTypeAnnotation(flowTypeAnnotation, types);

  switch (typeAnnotation.type) {
    case 'GenericTypeAnnotation': {
      switch (typeAnnotation.id.name) {
        case 'RootTag': {
          return emitRootTag(nullable);
        }
        case 'Promise': {
          return emitPromise(hasteModuleName, typeAnnotation, parser, nullable);
        }
        case 'Array':
        case '$ReadOnlyArray': {
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
        case '$ReadOnly': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            hasteModuleName,
            typeAnnotation,
            parser,
          );

          const [paramType, isParamNullable] = unwrapNullable(
            translateTypeAnnotation(
              hasteModuleName,
              typeAnnotation.typeParameters.params[0],
              types,
              aliasMap,
              tryParse,
              cxxOnly,
            ),
          );

          return wrapNullable(nullable || isParamNullable, paramType);
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
    case 'ObjectTypeAnnotation': {
      const objectTypeAnnotation = {
        type: 'ObjectTypeAnnotation',
        // $FlowFixMe[missing-type-arg]
        properties: ([
          ...typeAnnotation.properties,
          ...typeAnnotation.indexers,
        ]: Array<$FlowFixMe>)
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
                  language,
                  nullable,
                  translateTypeAnnotation,
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
    case 'BooleanTypeAnnotation': {
      return emitBoolean(nullable);
    }
    case 'NumberTypeAnnotation': {
      return emitNumber(nullable);
    }
    case 'VoidTypeAnnotation': {
      return emitVoid(nullable);
    }
    case 'StringTypeAnnotation': {
      return emitString(nullable);
    }
    case 'FunctionTypeAnnotation': {
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
    case 'UnionTypeAnnotation': {
      if (cxxOnly) {
        return emitUnionTypeAnnotation(
          nullable,
          hasteModuleName,
          typeAnnotation,
          language,
        );
      }
      // Fallthrough
    }
    case 'MixedTypeAnnotation': {
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

function buildPropertySchema(
  hasteModuleName: string,
  // TODO(T71778680): This is an ObjectTypeProperty containing either:
  // - a FunctionTypeAnnotation or GenericTypeAnnotation
  // - a NullableTypeAnnoation containing a FunctionTypeAnnotation or GenericTypeAnnotation
  // Flow type this node
  property: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
): NativeModulePropertyShape {
  let nullable = false;
  let {key, value} = property;

  const methodName: string = key.name;

  ({nullable, typeAnnotation: value} = resolveTypeAnnotation(value, types));

  throwIfModuleTypeIsUnsupported(
    hasteModuleName,
    property.value,
    property.key.name,
    value.type,
    language,
  );

  return {
    name: methodName,
    optional: property.optional,
    typeAnnotation: wrapNullable(
      nullable,
      translateFunctionTypeAnnotation(
        hasteModuleName,
        value,
        types,
        aliasMap,
        tryParse,
        cxxOnly,
        translateTypeAnnotation,
        language,
      ),
    ),
  };
}

function isModuleInterface(node: $FlowFixMe) {
  return (
    node.type === 'InterfaceDeclaration' &&
    node.extends.length === 1 &&
    node.extends[0].type === 'InterfaceExtends' &&
    node.extends[0].id.name === 'TurboModule'
  );
}

function buildModuleSchema(
  hasteModuleName: string,
  /**
   * TODO(T71778680): Flow-type this node.
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
    const {typeArguments} = callExpression;
    const methodName = callExpression.callee.property.name;

    throwIfWrongNumberOfCallExpressionArgs(
      hasteModuleName,
      callExpression,
      methodName,
      callExpression.arguments.length,
      language,
    );

    if (callExpression.arguments[0].type !== 'Literal') {
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
      typeArguments,
      hasteModuleName,
      callExpression,
      methodName,
      $moduleName,
      language,
    );

    throwIfIncorrectModuleRegistryCallTypeParameterParserError(
      hasteModuleName,
      typeArguments,
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

  // $FlowFixMe[missing-type-arg]
  return (moduleSpec.body.properties: $ReadOnlyArray<$FlowFixMe>)
    .filter(property => property.type === 'ObjectTypeProperty')
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
  flowTranslateTypeAnnotation: translateTypeAnnotation,
};
