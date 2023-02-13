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
  NamedShape,
  NativeModuleAliasMap,
  NativeModuleEnumMap,
  NativeModuleBaseTypeAnnotation,
  NativeModuleTypeAnnotation,
  NativeModulePropertyShape,
  NativeModuleSchema,
  Nullable,
} from '../../../CodegenSchema';

import type {Parser} from '../../parser';
import type {ParserErrorCapturer, TypeDeclarationMap} from '../../utils';

const {visit, isModuleRegistryCall, verifyPlatforms} = require('../../utils');
const {resolveTypeAnnotation, getTypes} = require('../utils');
const {
  unwrapNullable,
  wrapNullable,
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  parseObjectProperty,
  buildPropertySchema,
} = require('../../parsers-commons');
const {
  emitArrayType,
  emitBoolean,
  emitDouble,
  emitFloat,
  emitFunction,
  emitNumber,
  emitInt32,
  emitGenericObject,
  emitObject,
  emitPromise,
  emitRootTag,
  emitVoid,
  emitString,
  emitStringish,
  emitMixed,
  emitUnion,
  typeAliasResolution,
  typeEnumResolution,
} = require('../../parsers-primitives');

const {
  UnsupportedTypeAnnotationParserError,
  IncorrectModuleRegistryCallArgumentTypeParserError,
  UnsupportedGenericParserError,
} = require('../../errors');

const {
  throwIfModuleInterfaceNotFound,
  throwIfModuleInterfaceIsMisnamed,
  throwIfUnusedModuleInterfaceParserError,
  throwIfWrongNumberOfCallExpressionArgs,
  throwIfMoreThanOneModuleRegistryCalls,
  throwIfIncorrectModuleRegistryCallTypeParameterParserError,
  throwIfUntypedModule,
  throwIfMoreThanOneModuleInterfaceParserError,
} = require('../../error-utils');

const language = 'Flow';

function translateTypeAnnotation(
  hasteModuleName: string,
  /**
   * TODO(T71778680): Flow-type this node.
   */
  flowTypeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  parser: Parser,
): Nullable<NativeModuleTypeAnnotation> {
  const {nullable, typeAnnotation, typeResolutionStatus} =
    resolveTypeAnnotation(flowTypeAnnotation, types);

  switch (typeAnnotation.type) {
    case 'GenericTypeAnnotation': {
      switch (typeAnnotation.id.name) {
        case 'RootTag': {
          return emitRootTag(nullable);
        }
        case 'Promise': {
          return emitPromise(
            hasteModuleName,
            typeAnnotation,
            parser,
            nullable,
            types,
            aliasMap,
            enumMap,
            tryParse,
            cxxOnly,
            translateTypeAnnotation,
          );
        }
        case 'Array':
        case '$ReadOnlyArray': {
          return emitArrayType(
            hasteModuleName,
            typeAnnotation,
            parser,
            types,
            aliasMap,
            enumMap,
            cxxOnly,
            nullable,
            translateTypeAnnotation,
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
              enumMap,
              tryParse,
              cxxOnly,
              parser,
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
          return emitGenericObject(nullable);
        }
        case '$Partial': {
          if (typeAnnotation.typeParameters.params.length !== 1) {
            throw new Error(
              'Partials only support annotating exactly one parameter.',
            );
          }

          const annotatedElement =
            types[typeAnnotation.typeParameters.params[0].id.name];

          if (!annotatedElement) {
            throw new Error(
              'Partials only support annotating a type parameter.',
            );
          }

          const properties = annotatedElement.right.properties.map(prop => {
            return {
              name: prop.key.name,
              optional: true,
              typeAnnotation: translateTypeAnnotation(
                hasteModuleName,
                prop.value,
                types,
                aliasMap,
                enumMap,
                tryParse,
                cxxOnly,
                parser,
              ),
            };
          });

          return emitObject(nullable, properties);
        }
        default: {
          throw new UnsupportedGenericParserError(
            hasteModuleName,
            typeAnnotation,
            parser,
          );
        }
      }
    }
    case 'ObjectTypeAnnotation': {
      // if there is any indexer, then it is a dictionary
      if (typeAnnotation.indexers) {
        const indexers = typeAnnotation.indexers.filter(
          member => member.type === 'ObjectTypeIndexer',
        );
        if (indexers.length > 0) {
          // check the property type to prevent developers from using unsupported types
          // the return value from `translateTypeAnnotation` is unused
          const propertyType = indexers[0].value;
          translateTypeAnnotation(
            hasteModuleName,
            propertyType,
            types,
            aliasMap,
            enumMap,
            tryParse,
            cxxOnly,
            parser,
          );
          // no need to do further checking
          return emitGenericObject(nullable);
        }
      }

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
                  enumMap,
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
        typeResolutionStatus,
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
        enumMap,
        tryParse,
        cxxOnly,
        translateTypeAnnotation,
        parser,
      );
    }
    case 'UnionTypeAnnotation': {
      return emitUnion(nullable, hasteModuleName, typeAnnotation, parser);
    }
    case 'StringLiteralTypeAnnotation': {
      // 'a' is a special case for 'a' | 'b' but the type name is different
      return wrapNullable(nullable, {
        type: 'UnionTypeAnnotation',
        memberType: 'StringTypeAnnotation',
      });
    }
    case 'MixedTypeAnnotation': {
      if (cxxOnly) {
        return emitMixed(nullable);
      } else {
        return emitGenericObject(nullable);
      }
    }
    case 'EnumStringBody':
    case 'EnumNumberBody': {
      return typeEnumResolution(
        typeAnnotation,
        typeResolutionStatus,
        nullable,
        hasteModuleName,
        language,
        enumMap,
        parser,
      );
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
  parser: Parser,
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

  // Parse Module Name
  const moduleName = ((): string => {
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
    );

    throwIfMoreThanOneModuleRegistryCalls(
      hasteModuleName,
      callExpressions,
      callExpressions.length,
    );

    const [callExpression] = callExpressions;
    const {typeArguments} = callExpression;
    const methodName = callExpression.callee.property.name;

    throwIfWrongNumberOfCallExpressionArgs(
      hasteModuleName,
      callExpression,
      methodName,
      callExpression.arguments.length,
    );

    if (callExpression.arguments[0].type !== 'Literal') {
      const {type} = callExpression.arguments[0];
      throw new IncorrectModuleRegistryCallArgumentTypeParserError(
        hasteModuleName,
        callExpression.arguments[0],
        methodName,
        type,
      );
    }

    const $moduleName = callExpression.arguments[0].value;

    throwIfUntypedModule(
      typeArguments,
      hasteModuleName,
      callExpression,
      methodName,
      $moduleName,
    );

    throwIfIncorrectModuleRegistryCallTypeParameterParserError(
      hasteModuleName,
      typeArguments,
      methodName,
      $moduleName,
      parser,
    );

    return $moduleName;
  })();

  // Some module names use platform suffix to indicate platform-exclusive modules.
  // Eventually this should be made explicit in the Flow type itself.
  // Also check the hasteModuleName for platform suffix.
  // Note: this shape is consistent with ComponentSchema.
  const {cxxOnly, excludedPlatforms} = verifyPlatforms(
    hasteModuleName,
    moduleName,
  );

  // $FlowFixMe[missing-type-arg]
  return (moduleSpec.body.properties: $ReadOnlyArray<$FlowFixMe>)
    .filter(property => property.type === 'ObjectTypeProperty')
    .map<?{
      aliasMap: NativeModuleAliasMap,
      enumMap: NativeModuleEnumMap,
      propertyShape: NativeModulePropertyShape,
    }>(property => {
      const aliasMap: {...NativeModuleAliasMap} = {};
      const enumMap: {...NativeModuleEnumMap} = {};
      return tryParse(() => ({
        aliasMap: aliasMap,
        enumMap: enumMap,
        propertyShape: buildPropertySchema(
          hasteModuleName,
          property,
          types,
          aliasMap,
          enumMap,
          tryParse,
          cxxOnly,
          resolveTypeAnnotation,
          translateTypeAnnotation,
          parser,
        ),
      }));
    })
    .filter(Boolean)
    .reduce(
      (
        moduleSchema: NativeModuleSchema,
        {aliasMap, enumMap, propertyShape},
      ) => ({
        type: 'NativeModule',
        aliasMap: {...moduleSchema.aliasMap, ...aliasMap},
        enumMap: {...moduleSchema.enumMap, ...enumMap},
        spec: {
          properties: [...moduleSchema.spec.properties, propertyShape],
        },
        moduleName: moduleSchema.moduleName,
        excludedPlatforms: moduleSchema.excludedPlatforms,
      }),
      {
        type: 'NativeModule',
        aliasMap: {},
        enumMap: {},
        spec: {properties: []},
        moduleName,
        excludedPlatforms:
          excludedPlatforms.length !== 0 ? [...excludedPlatforms] : undefined,
      },
    );
}

module.exports = {
  buildModuleSchema,
  flowTranslateTypeAnnotation: translateTypeAnnotation,
};
