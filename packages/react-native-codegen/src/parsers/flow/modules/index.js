/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

const {resolveTypeAnnotation, getTypes} = require('../utils.js');
const {unwrapNullable, wrapNullable} = require('./utils');
const {
  IncorrectlyParameterizedFlowGenericParserError,
  MisnamedModuleFlowInterfaceParserError,
  ModuleFlowInterfaceNotParserError,
  UnnamedFunctionParamParserError,
  UnsupportedArrayElementTypeAnnotationParserError,
  UnsupportedFlowGenericParserError,
  UnsupportedFlowTypeAnnotationParserError,
  UnsupportedFunctionParamTypeAnnotationParserError,
  UnsupportedFunctionReturnTypeAnnotationParserError,
  UnsupportedModulePropertyParserError,
  UnsupportedObjectPropertyTypeAnnotationParserError,
  UnsupportedObjectPropertyValueTypeAnnotationParserError,
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
  guard: ParserErrorCapturer,
): Nullable<NativeModuleTypeAnnotation> {
  const {
    nullable,
    typeAnnotation,
    typeAliasResolutionStatus,
  } = resolveTypeAnnotation(flowTypeAnnotation, types);

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

          return translateTypeAnnotation(
            hasteModuleName,
            typeAnnotation.typeParameters.params[0],
            types,
            aliasMap,
            guard,
          );
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
        properties: (typeAnnotation.properties: Array<$FlowFixMe>)
          .map<?NamedShape<Nullable<NativeModuleBaseTypeAnnotation>>>(
            property => {
              return guard(() => {
                if (property.type !== 'ObjectTypeProperty') {
                  throw new UnsupportedObjectPropertyTypeAnnotationParserError(
                    hasteModuleName,
                    property,
                    property.type,
                  );
                }

                const {optional, key} = property;

                const [
                  propertyTypeAnnotation,
                  isPropertyNullable,
                ] = unwrapNullable(
                  translateTypeAnnotation(
                    hasteModuleName,
                    property.value,
                    types,
                    aliasMap,
                    guard,
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
          guard,
        ),
      );
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
  guard: ParserErrorCapturer,
): NativeModuleFunctionTypeAnnotation {
  type Param = NamedShape<Nullable<NativeModuleParamTypeAnnotation>>;
  const params: Array<Param> = [];

  for (const flowParam of (flowFunctionTypeAnnotation.params: $ReadOnlyArray<$FlowFixMe>)) {
    const parsedParam = guard(() => {
      if (flowParam.name == null) {
        throw new UnnamedFunctionParamParserError(flowParam, hasteModuleName);
      }

      const paramName = flowParam.name.name;
      const [
        paramTypeAnnotation,
        isParamTypeAnnotationNullable,
      ] = unwrapNullable(
        translateTypeAnnotation(
          hasteModuleName,
          flowParam.typeAnnotation,
          types,
          aliasMap,
          guard,
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
      guard,
    ),
  );

  if (returnTypeAnnotation.type === 'FunctionTypeAnnotation') {
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
  guard: ParserErrorCapturer,
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
        guard,
      ),
    ),
  };
}

function buildModuleSchema(
  hasteModuleName: string,
  moduleNames: $ReadOnlyArray<string>,
  /**
   * TODO(T71778680): Flow-type this node.
   */
  ast: $FlowFixMe,
  guard: ParserErrorCapturer,
): NativeModuleSchema {
  const types = getTypes(ast);
  const moduleInterfaceNames = (Object.keys(
    types,
  ): $ReadOnlyArray<string>).filter((typeName: string) => {
    const declaration = types[typeName];
    return (
      declaration.type === 'InterfaceDeclaration' &&
      declaration.extends.length === 1 &&
      declaration.extends[0].type === 'InterfaceExtends' &&
      declaration.extends[0].id.name === 'TurboModule'
    );
  });

  if (moduleInterfaceNames.length !== 1) {
    throw new ModuleFlowInterfaceNotParserError(hasteModuleName, ast);
  }

  const [moduleInterfaceName] = moduleInterfaceNames;

  if (moduleInterfaceName !== 'Spec') {
    throw new MisnamedModuleFlowInterfaceParserError(
      hasteModuleName,
      types[moduleInterfaceName].id,
    );
  }

  // Some module names use platform suffix to indicate platform-exclusive modules.
  // Eventually this should be made explicit in the Flow type itself.
  // Also check the hasteModuleName for platform suffix.
  // Note: this shape is consistent with ComponentSchema.
  const excludedPlatforms = [];
  const namesToValidate = [...moduleNames, hasteModuleName];
  namesToValidate.forEach(name => {
    if (name.endsWith('Android')) {
      excludedPlatforms.push('iOS');
    } else if (name.endsWith('IOS')) {
      excludedPlatforms.push('android');
    }
  });

  const declaration = types[moduleInterfaceName];
  return (declaration.body.properties: $ReadOnlyArray<$FlowFixMe>)
    .filter(property => property.type === 'ObjectTypeProperty')
    .map<?{
      aliasMap: NativeModuleAliasMap,
      propertyShape: NativeModulePropertyShape,
    }>(property => {
      const aliasMap: {...NativeModuleAliasMap} = {};

      return guard(() => ({
        aliasMap: aliasMap,
        propertyShape: buildPropertySchema(
          hasteModuleName,
          property,
          types,
          aliasMap,
          guard,
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
