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
  NamedShape,
  NativeModuleAliasMap,
  NativeModuleBaseTypeAnnotation,
  NativeModuleSchema,
  NativeModuleTypeAnnotation,
  NativeModuleFunctionTypeAnnotation,
  NativeModuleParamTypeAnnotation,
  NativeModulePropertyShape,
  SchemaType,
  NativeModuleEnumMap,
  OptionsShape,
} from '../CodegenSchema.js';

import type {Parser} from './parser';
import type {ParserType} from './errors';
import type {ParserErrorCapturer, TypeDeclarationMap} from './utils';
import type {ComponentSchemaBuilderConfig} from './schema.js';

const {
  getConfigType,
  extractNativeModuleName,
  createParserErrorCapturer,
  visit,
  isModuleRegistryCall,
  verifyPlatforms,
} = require('./utils');
const {
  throwIfPropertyValueTypeIsUnsupported,
  throwIfUnsupportedFunctionParamTypeAnnotationParserError,
  throwIfUnsupportedFunctionReturnTypeAnnotationParserError,
  throwIfModuleTypeIsUnsupported,
  throwIfUnusedModuleInterfaceParserError,
  throwIfMoreThanOneModuleRegistryCalls,
  throwIfWrongNumberOfCallExpressionArgs,
  throwIfUntypedModule,
  throwIfIncorrectModuleRegistryCallTypeParameterParserError,
  throwIfIncorrectModuleRegistryCallArgument,
  throwIfModuleInterfaceNotFound,
  throwIfMoreThanOneModuleInterfaceParserError,
  throwIfModuleInterfaceIsMisnamed,
} = require('./error-utils');

const {
  MissingTypeParameterGenericParserError,
  MoreThanOneTypeParameterGenericParserError,
  UnnamedFunctionParamParserError,
} = require('./errors');

const invariant = require('invariant');

export type CommandOptions = $ReadOnly<{
  supportedCommands: $ReadOnlyArray<string>,
}>;

// $FlowFixMe[unclear-type] TODO(T108222691): Use flow-types for @babel/parser
type OptionsAST = Object;

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
  parser: Parser,
) {
  if (typeAnnotation.typeParameters == null) {
    throw new MissingTypeParameterGenericParserError(
      moduleName,
      typeAnnotation,
      parser,
    );
  }

  const typeAnnotationType = parser.typeParameterInstantiation;

  invariant(
    typeAnnotation.typeParameters.type === typeAnnotationType,
    `assertGenericTypeAnnotationHasExactlyOneTypeParameter: Type parameters must be an AST node of type '${typeAnnotationType}'`,
  );

  if (typeAnnotation.typeParameters.params.length !== 1) {
    throw new MoreThanOneTypeParameterGenericParserError(
      moduleName,
      typeAnnotation,
      parser,
    );
  }
}

function isObjectProperty(property: $FlowFixMe, language: ParserType): boolean {
  switch (language) {
    case 'Flow':
      return property.type === 'ObjectTypeProperty';
    case 'TypeScript':
      return property.type === 'TSPropertySignature';
    default:
      return false;
  }
}

function parseObjectProperty(
  property: $FlowFixMe,
  hasteModuleName: string,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  nullable: boolean,
  translateTypeAnnotation: $FlowFixMe,
  parser: Parser,
): NamedShape<Nullable<NativeModuleBaseTypeAnnotation>> {
  const language = parser.language();

  const name = parser.getKeyName(property, hasteModuleName);
  const {optional = false} = property;
  const languageTypeAnnotation =
    language === 'TypeScript'
      ? property.typeAnnotation.typeAnnotation
      : property.value;

  const [propertyTypeAnnotation, isPropertyNullable] =
    unwrapNullable<$FlowFixMe>(
      translateTypeAnnotation(
        hasteModuleName,
        languageTypeAnnotation,
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        parser,
      ),
    );

  if (
    propertyTypeAnnotation.type === 'FunctionTypeAnnotation' ||
    propertyTypeAnnotation.type === 'PromiseTypeAnnotation' ||
    propertyTypeAnnotation.type === 'VoidTypeAnnotation'
  ) {
    throwIfPropertyValueTypeIsUnsupported(
      hasteModuleName,
      languageTypeAnnotation,
      property.key,
      propertyTypeAnnotation.type,
    );
  }

  return {
    name,
    optional,
    typeAnnotation: wrapNullable(isPropertyNullable, propertyTypeAnnotation),
  };
}

function translateFunctionTypeAnnotation(
  hasteModuleName: string,
  // TODO(T108222691): Use flow-types for @babel/parser
  // TODO(T71778680): This is a FunctionTypeAnnotation. Type this.
  functionTypeAnnotation: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  translateTypeAnnotation: $FlowFixMe,
  parser: Parser,
): NativeModuleFunctionTypeAnnotation {
  type Param = NamedShape<Nullable<NativeModuleParamTypeAnnotation>>;
  const params: Array<Param> = [];

  for (const param of parser.getFunctionTypeAnnotationParameters(
    functionTypeAnnotation,
  )) {
    const parsedParam = tryParse(() => {
      if (parser.getFunctionNameFromParameter(param) == null) {
        throw new UnnamedFunctionParamParserError(param, hasteModuleName);
      }

      const paramName = parser.getParameterName(param);

      const [paramTypeAnnotation, isParamTypeAnnotationNullable] =
        unwrapNullable<$FlowFixMe>(
          translateTypeAnnotation(
            hasteModuleName,
            parser.getParameterTypeAnnotation(param),
            types,
            aliasMap,
            enumMap,
            tryParse,
            cxxOnly,
            parser,
          ),
        );

      if (
        paramTypeAnnotation.type === 'VoidTypeAnnotation' ||
        paramTypeAnnotation.type === 'PromiseTypeAnnotation'
      ) {
        return throwIfUnsupportedFunctionParamTypeAnnotationParserError(
          hasteModuleName,
          param.typeAnnotation,
          paramName,
          paramTypeAnnotation.type,
        );
      }

      return {
        name: paramName,
        optional: Boolean(param.optional),
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

  const [returnTypeAnnotation, isReturnTypeAnnotationNullable] =
    unwrapNullable<$FlowFixMe>(
      translateTypeAnnotation(
        hasteModuleName,
        parser.getFunctionTypeAnnotationReturnType(functionTypeAnnotation),
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        parser,
      ),
    );

  throwIfUnsupportedFunctionReturnTypeAnnotationParserError(
    hasteModuleName,
    functionTypeAnnotation,
    'FunctionTypeAnnotation',
    cxxOnly,
    returnTypeAnnotation.type,
  );

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
  // TODO(T108222691): [TS] Use flow-types for @babel/parser
  // TODO(T71778680): [Flow] This is an ObjectTypeProperty containing either:
  // - a FunctionTypeAnnotation or GenericTypeAnnotation
  // - a NullableTypeAnnoation containing a FunctionTypeAnnotation or GenericTypeAnnotation
  // Flow type this node
  property: $FlowFixMe,
  types: TypeDeclarationMap,
  aliasMap: {...NativeModuleAliasMap},
  enumMap: {...NativeModuleEnumMap},
  tryParse: ParserErrorCapturer,
  cxxOnly: boolean,
  resolveTypeAnnotation: $FlowFixMe,
  translateTypeAnnotation: $FlowFixMe,
  parser: Parser,
): NativeModulePropertyShape {
  let nullable: boolean = false;
  let {key, value} = property;
  const methodName: string = key.name;

  if (parser.language() === 'TypeScript') {
    value =
      property.type === 'TSMethodSignature'
        ? property
        : property.typeAnnotation;
  }

  ({nullable, typeAnnotation: value} = resolveTypeAnnotation(value, types));

  throwIfModuleTypeIsUnsupported(
    hasteModuleName,
    property.value,
    key.name,
    value.type,
    parser,
  );

  return {
    name: methodName,
    optional: Boolean(property.optional),
    typeAnnotation: wrapNullable(
      nullable,
      translateFunctionTypeAnnotation(
        hasteModuleName,
        value,
        types,
        aliasMap,
        enumMap,
        tryParse,
        cxxOnly,
        translateTypeAnnotation,
        parser,
      ),
    ),
  };
}

function buildSchemaFromConfigType(
  configType: 'module' | 'component' | 'none',
  filename: ?string,
  ast: $FlowFixMe,
  wrapComponentSchema: (config: ComponentSchemaBuilderConfig) => SchemaType,
  buildComponentSchema: (
    ast: $FlowFixMe,
    parser: Parser,
  ) => ComponentSchemaBuilderConfig,
  buildModuleSchema: (
    hasteModuleName: string,
    ast: $FlowFixMe,
    tryParse: ParserErrorCapturer,
    parser: Parser,
    resolveTypeAnnotation: $FlowFixMe,
    translateTypeAnnotation: $FlowFixMe,
  ) => NativeModuleSchema,
  parser: Parser,
  resolveTypeAnnotation: $FlowFixMe,
  translateTypeAnnotation: $FlowFixMe,
): SchemaType {
  switch (configType) {
    case 'component': {
      return wrapComponentSchema(buildComponentSchema(ast, parser));
    }
    case 'module': {
      if (filename === undefined || filename === null) {
        throw new Error('Filepath expected while parasing a module');
      }
      const nativeModuleName = extractNativeModuleName(filename);

      const [parsingErrors, tryParse] = createParserErrorCapturer();

      const schema = tryParse(() =>
        buildModuleSchema(
          nativeModuleName,
          ast,
          tryParse,
          parser,
          resolveTypeAnnotation,
          translateTypeAnnotation,
        ),
      );

      if (parsingErrors.length > 0) {
        /**
         * TODO(T77968131): We have two options:
         *  - Throw the first error, but indicate there are more then one errors.
         *  - Display all errors, nicely formatted.
         *
         * For the time being, we're just throw the first error.
         **/

        throw parsingErrors[0];
      }

      invariant(
        schema != null,
        'When there are no parsing errors, the schema should not be null',
      );

      return wrapModuleSchema(schema, nativeModuleName);
    }
    default:
      return {modules: {}};
  }
}

function buildSchema(
  contents: string,
  filename: ?string,
  wrapComponentSchema: (config: ComponentSchemaBuilderConfig) => SchemaType,
  buildComponentSchema: (
    ast: $FlowFixMe,
    parser: Parser,
  ) => ComponentSchemaBuilderConfig,
  buildModuleSchema: (
    hasteModuleName: string,
    ast: $FlowFixMe,
    tryParse: ParserErrorCapturer,
    parser: Parser,
    resolveTypeAnnotation: $FlowFixMe,
    translateTypeAnnotation: $FlowFixMe,
  ) => NativeModuleSchema,
  Visitor: ({isComponent: boolean, isModule: boolean}) => {
    [type: string]: (node: $FlowFixMe) => void,
  },
  parser: Parser,
  resolveTypeAnnotation: $FlowFixMe,
  translateTypeAnnotation: $FlowFixMe,
): SchemaType {
  // Early return for non-Spec JavaScript files
  if (
    !contents.includes('codegenNativeComponent') &&
    !contents.includes('TurboModule')
  ) {
    return {modules: {}};
  }

  const ast = parser.getAst(contents);
  const configType = getConfigType(ast, Visitor);

  return buildSchemaFromConfigType(
    configType,
    filename,
    ast,
    wrapComponentSchema,
    buildComponentSchema,
    buildModuleSchema,
    parser,
    resolveTypeAnnotation,
    translateTypeAnnotation,
  );
}

function createComponentConfig(
  foundConfig: $FlowFixMe,
  commandsTypeNames: $FlowFixMe,
): $FlowFixMe {
  return {
    ...foundConfig,
    commandTypeName:
      commandsTypeNames[0] == null
        ? null
        : commandsTypeNames[0].commandTypeName,
    commandOptionsExpression:
      commandsTypeNames[0] == null
        ? null
        : commandsTypeNames[0].commandOptionsExpression,
  };
}

const parseModuleName = (
  hasteModuleName: string,
  moduleSpec: $FlowFixMe,
  ast: $FlowFixMe,
  parser: Parser,
): string => {
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
  const typeParameters = parser.callExpressionTypeParameters(callExpression);
  const methodName = callExpression.callee.property.name;

  throwIfWrongNumberOfCallExpressionArgs(
    hasteModuleName,
    callExpression,
    methodName,
    callExpression.arguments.length,
  );

  throwIfIncorrectModuleRegistryCallArgument(
    hasteModuleName,
    callExpression.arguments[0],
    methodName,
  );

  const $moduleName = callExpression.arguments[0].value;

  throwIfUntypedModule(
    typeParameters,
    hasteModuleName,
    callExpression,
    methodName,
    $moduleName,
  );

  throwIfIncorrectModuleRegistryCallTypeParameterParserError(
    hasteModuleName,
    typeParameters,
    methodName,
    $moduleName,
    parser,
  );

  return $moduleName;
};

const buildModuleSchema = (
  hasteModuleName: string,
  /**
   * TODO(T71778680): Flow-type this node.
   */
  ast: $FlowFixMe,
  tryParse: ParserErrorCapturer,
  parser: Parser,
  resolveTypeAnnotation: $FlowFixMe,
  translateTypeAnnotation: $FlowFixMe,
): NativeModuleSchema => {
  const language = parser.language();
  const types = parser.getTypes(ast);
  const moduleSpecs = (Object.values(types): $ReadOnlyArray<$FlowFixMe>).filter(
    t => parser.isModuleInterface(t),
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
  const moduleName = parseModuleName(hasteModuleName, moduleSpec, ast, parser);

  // Some module names use platform suffix to indicate platform-exclusive modules.
  // Eventually this should be made explicit in the Flow type itself.
  // Also check the hasteModuleName for platform suffix.
  // Note: this shape is consistent with ComponentSchema.
  const {cxxOnly, excludedPlatforms} = verifyPlatforms(
    hasteModuleName,
    moduleName,
  );

  const properties: $ReadOnlyArray<$FlowFixMe> =
    language === 'Flow' ? moduleSpec.body.properties : moduleSpec.body.body;

  // $FlowFixMe[missing-type-arg]
  return properties
    .filter(
      property =>
        property.type === 'ObjectTypeProperty' ||
        property.type === 'TSPropertySignature' ||
        property.type === 'TSMethodSignature',
    )
    .map<?{
      aliasMap: NativeModuleAliasMap,
      enumMap: NativeModuleEnumMap,
      propertyShape: NativeModulePropertyShape,
    }>(property => {
      const aliasMap: {...NativeModuleAliasMap} = {};
      const enumMap: {...NativeModuleEnumMap} = {};

      return tryParse(() => ({
        aliasMap,
        enumMap,
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
};

/**
 * This function is used to find the type of a native component
 * provided the default exports statement from generated AST.
 * @param statement The statement to be parsed.
 * @param foundConfigs The 'mutable' array of configs that have been found.
 * @param parser The language parser to be used.
 * @returns void
 */
function findNativeComponentType(
  statement: $FlowFixMe,
  foundConfigs: Array<{[string]: string}>,
  parser: Parser,
): void {
  let declaration = statement.declaration;

  // codegenNativeComponent can be nested inside a cast
  // expression so we need to go one level deeper
  if (
    declaration.type === 'TSAsExpression' ||
    declaration.type === 'TypeCastExpression'
  ) {
    declaration = declaration.expression;
  }

  try {
    if (declaration.callee.name === 'codegenNativeComponent') {
      const typeArgumentParams =
        parser.getTypeArgumentParamsFromDeclaration(declaration);
      const funcArgumentParams = declaration.arguments;

      const nativeComponentType: {[string]: string} =
        parser.getNativeComponentType(typeArgumentParams, funcArgumentParams);
      if (funcArgumentParams.length > 1) {
        nativeComponentType.optionsExpression = funcArgumentParams[1];
      }
      foundConfigs.push(nativeComponentType);
    }
  } catch (e) {
    // ignore
  }
}

function getCommandOptions(
  commandOptionsExpression: OptionsAST,
): ?CommandOptions {
  if (commandOptionsExpression == null) {
    return null;
  }

  let foundOptions;
  try {
    foundOptions = commandOptionsExpression.properties.reduce(
      (options, prop) => {
        options[prop.key.name] = (
          (prop && prop.value && prop.value.elements) ||
          []
        ).map(element => element && element.value);
        return options;
      },
      {},
    );
  } catch (e) {
    throw new Error(
      'Failed to parse command options, please check that they are defined correctly',
    );
  }

  return foundOptions;
}

function getOptions(optionsExpression: OptionsAST): ?OptionsShape {
  if (!optionsExpression) {
    return null;
  }
  let foundOptions;
  try {
    foundOptions = optionsExpression.properties.reduce((options, prop) => {
      if (prop.value.type === 'ArrayExpression') {
        options[prop.key.name] = prop.value.elements.map(
          element => element.value,
        );
      } else {
        options[prop.key.name] = prop.value.value;
      }
      return options;
    }, {});
  } catch (e) {
    throw new Error(
      'Failed to parse codegen options, please check that they are defined correctly',
    );
  }

  if (
    foundOptions.paperComponentName &&
    foundOptions.paperComponentNameDeprecated
  ) {
    throw new Error(
      'Failed to parse codegen options, cannot use both paperComponentName and paperComponentNameDeprecated',
    );
  }

  return foundOptions;
}

module.exports = {
  wrapModuleSchema,
  unwrapNullable,
  wrapNullable,
  assertGenericTypeAnnotationHasExactlyOneTypeParameter,
  isObjectProperty,
  parseObjectProperty,
  translateFunctionTypeAnnotation,
  buildPropertySchema,
  buildSchemaFromConfigType,
  buildSchema,
  createComponentConfig,
  parseModuleName,
  buildModuleSchema,
  findNativeComponentType,
  getCommandOptions,
  getOptions,
};
