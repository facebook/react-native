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

import type {TypeDeclarationMap} from '../utils.js';
import type {ParserErrorCapturer} from '../utils';
import type {NativeModuleTypeAnnotation} from '../../../CodegenSchema.js';

const {
  resolveTypeAnnotation,
  getTypes,
  visit,
  isModuleRegistryCall,
} = require('../utils.js');
const {unwrapNullable, wrapNullable} = require('./utils');
const {
  IncorrectlyParameterizedFlowGenericParserError,
  MisnamedModuleFlowInterfaceParserError,
  ModuleFlowInterfaceNotFoundParserError,
  MoreThanOneModuleFlowInterfaceParserError,
  UnnamedFunctionParamParserError,
  UnsupportedArrayElementTypeAnnotationParserError,
  UnsupportedFlowGenericParserError,
  UnsupportedFlowTypeAnnotationParserError,
  UnsupportedFunctionParamTypeAnnotationParserError,
  UnsupportedFunctionReturnTypeAnnotationParserError,
  UnsupportedModulePropertyParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError,
  UnsupportedObjectPropertyValueTypeAnnotationParserError,
  UnusedModuleFlowInterfaceParserError,
  MoreThanOneModuleRegistryCallsParserError,
  UntypedModuleRegistryCallParserError,
  IncorrectModuleRegistryCallTypeParameterParserError,
  IncorrectModuleRegistryCallArityParserError,
  IncorrectModuleRegistryCallArgumentTypeParserError,
} = require('./errors.js');

const invariant = require('invariant');

function nullGuard<T>(fn: () => T): ?T {
  return fn();
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
          return wrapNullable(nullable, {
            type: 'ReservedTypeAnnotation',
            name: 'RootTag',
          });
        }
        case 'Promise': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            hasteModuleName,
            typeAnnotation,
          );

          return wrapNullable(nullable, {
            type: 'PromiseTypeAnnotation',
          });
        }
        case 'Array':
        case '$ReadOnlyArray': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            hasteModuleName,
            typeAnnotation,
          );

          try {
            /**
             * TODO(T72031674): Migrate all our NativeModule specs to not use
             * invalid Array ElementTypes. Then, make the elementType a required
             * parameter.
             */
            const [elementType, isElementTypeNullable] = unwrapNullable(
              translateTypeAnnotation(
                hasteModuleName,
                typeAnnotation.typeParameters.params[0],
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
                typeAnnotation.typeParameters.params[0],
                typeAnnotation.type,
                'void',
              );
            }

            if (elementType.type === 'PromiseTypeAnnotation') {
              throw new UnsupportedArrayElementTypeAnnotationParserError(
                hasteModuleName,
                typeAnnotation.typeParameters.params[0],
                typeAnnotation.type,
                'Promise',
              );
            }

            if (elementType.type === 'FunctionTypeAnnotation') {
              throw new UnsupportedArrayElementTypeAnnotationParserError(
                hasteModuleName,
                typeAnnotation.typeParameters.params[0],
                typeAnnotation.type,
                'FunctionTypeAnnotation',
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
        case '$ReadOnly': {
          assertGenericTypeAnnotationHasExactlyOneTypeParameter(
            hasteModuleName,
            typeAnnotation,
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
          return wrapNullable(nullable, {
            type: 'StringTypeAnnotation',
          });
        }
        case 'Int32': {
          return wrapNullable(nullable, {
            type: 'Int32TypeAnnotation',
          });
        }
        case 'Double': {
          return wrapNullable(nullable, {
            type: 'DoubleTypeAnnotation',
          });
        }
        case 'Float': {
          return wrapNullable(nullable, {
            type: 'FloatTypeAnnotation',
          });
        }
        case 'UnsafeObject':
        case 'Object': {
          return wrapNullable(nullable, {
            type: 'GenericObjectTypeAnnotation',
          });
        }
        default: {
          throw new UnsupportedFlowGenericParserError(
            hasteModuleName,
            typeAnnotation,
          );
        }
      }
    }
    case 'ObjectTypeAnnotation': {
      const objectTypeAnnotation = {
        type: 'ObjectTypeAnnotation',
        // $FlowFixMe[missing-type-arg]
        properties: (typeAnnotation.properties: Array<$FlowFixMe>)
          .map<?NamedShape<Nullable<NativeModuleBaseTypeAnnotation>>>(
            property => {
              return tryParse(() => {
                if (property.type !== 'ObjectTypeProperty') {
                  throw new UnsupportedObjectPropertyTypeAnnotationParserError(
                    hasteModuleName,
                    property,
                    property.type,
                  );
                }

                const {optional, key} = property;

                const [propertyTypeAnnotation, isPropertyNullable] =
                  unwrapNullable(
                    translateTypeAnnotation(
                      hasteModuleName,
                      property.value,
                      types,
                      aliasMap,
                      tryParse,
                      cxxOnly,
                    ),
                  );

                if (propertyTypeAnnotation.type === 'FunctionTypeAnnotation') {
                  throw new UnsupportedObjectPropertyValueTypeAnnotationParserError(
                    hasteModuleName,
                    property.value,
                    property.key,
                    propertyTypeAnnotation.type,
                  );
                }

                if (propertyTypeAnnotation.type === 'VoidTypeAnnotation') {
                  throw new UnsupportedObjectPropertyValueTypeAnnotationParserError(
                    hasteModuleName,
                    property.value,
                    property.key,
                    'void',
                  );
                }

                if (propertyTypeAnnotation.type === 'PromiseTypeAnnotation') {
                  throw new UnsupportedObjectPropertyValueTypeAnnotationParserError(
                    hasteModuleName,
                    property.value,
                    property.key,
                    'Promise',
                  );
                }

                return {
                  name: key.name,
                  optional,
                  typeAnnotation: wrapNullable(
                    isPropertyNullable,
                    propertyTypeAnnotation,
                  ),
                };
              });
            },
          )
          .filter(Boolean),
      };

      if (!typeAliasResolutionStatus.successful) {
        return wrapNullable(nullable, objectTypeAnnotation);
      }

      /**
       * All aliases RHS are required.
       */
      aliasMap[typeAliasResolutionStatus.aliasName] = objectTypeAnnotation;

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
        name: typeAliasResolutionStatus.aliasName,
      });
    }
    case 'BooleanTypeAnnotation': {
      return wrapNullable(nullable, {
        type: 'BooleanTypeAnnotation',
      });
    }
    case 'NumberTypeAnnotation': {
      return wrapNullable(nullable, {
        type: 'NumberTypeAnnotation',
      });
    }
    case 'VoidTypeAnnotation': {
      return wrapNullable(nullable, {
        type: 'VoidTypeAnnotation',
      });
    }
    case 'StringTypeAnnotation': {
      return wrapNullable(nullable, {
        type: 'StringTypeAnnotation',
      });
    }
    case 'FunctionTypeAnnotation': {
      return wrapNullable(
        nullable,
        translateFunctionTypeAnnotation(
          hasteModuleName,
          typeAnnotation,
          types,
          aliasMap,
          tryParse,
          cxxOnly,
        ),
      );
    }
    case 'MixedTypeAnnotation': {
      if (cxxOnly) {
        return wrapNullable(nullable, {
          type: 'MixedTypeAnnotation',
        });
      }
      // Fallthrough
    }
    default: {
      throw new UnsupportedFlowTypeAnnotationParserError(
        hasteModuleName,
        typeAnnotation,
      );
    }
  }
}

function assertGenericTypeAnnotationHasExactlyOneTypeParameter(
  moduleName: string,
  /**
   * TODO(T71778680): This is a GenericTypeAnnotation. Flow type this node
   */
  typeAnnotation: $FlowFixMe,
) {
  if (typeAnnotation.typeParameters == null) {
    throw new IncorrectlyParameterizedFlowGenericParserError(
      moduleName,
      typeAnnotation,
    );
  }

  invariant(
    typeAnnotation.typeParameters.type === 'TypeParameterInstantiation',
    "assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type 'TypeParameterInstantiation'",
  );

  if (typeAnnotation.typeParameters.params.length !== 1) {
    throw new IncorrectlyParameterizedFlowGenericParserError(
      moduleName,
      typeAnnotation,
    );
  }
}

function translateFunctionTypeAnnotation(
  hasteModuleName: string,
  // TODO(T71778680): This is a FunctionTypeAnnotation. Type this.
  flowFunctionTypeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
): NativeModuleFunctionTypeAnnotation {
  type Param = NamedShape<Nullable<NativeModuleParamTypeAnnotation>>;
  const params: Array<Param> = [];

  for (const flowParam of (flowFunctionTypeAnnotation.params: $ReadOnlyArray<$FlowFixMe>)) {
    const parsedParam = tryParse(() => {
      if (flowParam.name == null) {
        throw new UnnamedFunctionParamParserError(flowParam, hasteModuleName);
      }

      const paramName = flowParam.name.name;
      const [paramTypeAnnotation, isParamTypeAnnotationNullable] =
        unwrapNullable(
          translateTypeAnnotation(
            hasteModuleName,
            flowParam.typeAnnotation,
            types,
            aliasMap,
            tryParse,
            cxxOnly,
          ),
        );

      if (paramTypeAnnotation.type === 'VoidTypeAnnotation') {
        throw new UnsupportedFunctionParamTypeAnnotationParserError(
          hasteModuleName,
          flowParam.typeAnnotation,
          paramName,
          'void',
        );
      }

      if (paramTypeAnnotation.type === 'PromiseTypeAnnotation') {
        throw new UnsupportedFunctionParamTypeAnnotationParserError(
          hasteModuleName,
          flowParam.typeAnnotation,
          paramName,
          'Promise',
        );
      }

      return {
        name: flowParam.name.name,
        optional: flowParam.optional,
        typeAnnotation: wrapNullable(
          isParamTypeAnnotationNullable,
          paramTypeAnnotation,
        ),
      };
    });

    if (parsedParam != null) {
      params.push(parsedParam);
    }
  }

  const [returnTypeAnnotation, isReturnTypeAnnotationNullable] = unwrapNullable(
    translateTypeAnnotation(
      hasteModuleName,
      flowFunctionTypeAnnotation.returnType,
      types,
      aliasMap,
      tryParse,
      cxxOnly,
    ),
  );

  if (!cxxOnly && returnTypeAnnotation.type === 'FunctionTypeAnnotation') {
    throw new UnsupportedFunctionReturnTypeAnnotationParserError(
      hasteModuleName,
      flowFunctionTypeAnnotation.returnType,
      'FunctionTypeAnnotation',
    );
  }

  return {
    type: 'FunctionTypeAnnotation',
    returnTypeAnnotation: wrapNullable(
      isReturnTypeAnnotationNullable,
      returnTypeAnnotation,
    ),
    params,
  };
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

  if (value.type !== 'FunctionTypeAnnotation') {
    throw new UnsupportedModulePropertyParserError(
      hasteModuleName,
      property.value,
      property.key.name,
      value.type,
    );
  }

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

  if (moduleSpecs.length === 0) {
    throw new ModuleFlowInterfaceNotFoundParserError(hasteModuleName, ast);
  }

  if (moduleSpecs.length > 1) {
    throw new MoreThanOneModuleFlowInterfaceParserError(
      hasteModuleName,
      moduleSpecs,
      moduleSpecs.map(node => node.id.name),
    );
  }

  const [moduleSpec] = moduleSpecs;

  if (moduleSpec.id.name !== 'Spec') {
    throw new MisnamedModuleFlowInterfaceParserError(
      hasteModuleName,
      moduleSpec.id,
    );
  }

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

    if (callExpressions.length === 0) {
      throw new UnusedModuleFlowInterfaceParserError(
        hasteModuleName,
        moduleSpec,
      );
    }

    if (callExpressions.length > 1) {
      throw new MoreThanOneModuleRegistryCallsParserError(
        hasteModuleName,
        callExpressions,
        callExpressions.length,
      );
    }

    const [callExpression] = callExpressions;
    const {typeArguments} = callExpression;
    const methodName = callExpression.callee.property.name;

    if (callExpression.arguments.length !== 1) {
      throw new IncorrectModuleRegistryCallArityParserError(
        hasteModuleName,
        callExpression,
        methodName,
        callExpression.arguments.length,
      );
    }

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

    if (typeArguments == null) {
      throw new UntypedModuleRegistryCallParserError(
        hasteModuleName,
        callExpression,
        methodName,
        $moduleName,
      );
    }

    if (
      typeArguments.type !== 'TypeParameterInstantiation' ||
      typeArguments.params.length !== 1 ||
      typeArguments.params[0].type !== 'GenericTypeAnnotation' ||
      typeArguments.params[0].id.name !== 'Spec'
    ) {
      throw new IncorrectModuleRegistryCallTypeParameterParserError(
        hasteModuleName,
        typeArguments,
        methodName,
        $moduleName,
      );
    }

    return $moduleName;
  });

  const moduleNames = moduleName == null ? [] : [moduleName];

  // Some module names use platform suffix to indicate platform-exclusive modules.
  // Eventually this should be made explicit in the Flow type itself.
  // Also check the hasteModuleName for platform suffix.
  // Note: this shape is consistent with ComponentSchema.
  let cxxOnly = false;
  const excludedPlatforms = [];
  const namesToValidate = [...moduleNames, hasteModuleName];
  namesToValidate.forEach(name => {
    if (name.endsWith('Android')) {
      excludedPlatforms.push('iOS');
    } else if (name.endsWith('IOS')) {
      excludedPlatforms.push('android');
    } else if (name.endsWith('Cxx')) {
      cxxOnly = true;
      excludedPlatforms.push('iOS', 'android');
    }
  });

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
};
