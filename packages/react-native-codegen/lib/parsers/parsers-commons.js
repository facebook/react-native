/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict';

function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r &&
      (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })),
      t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2
      ? ownKeys(Object(t), !0).forEach(function (r) {
          _defineProperty(e, r, t[r]);
        })
      : Object.getOwnPropertyDescriptors
      ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t))
      : ownKeys(Object(t)).forEach(function (r) {
          Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
  }
  return e;
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true,
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, 'string');
  return 'symbol' == typeof i ? i : String(i);
}
function _toPrimitive(t, r) {
  if ('object' != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r || 'default');
    if ('object' != typeof i) return i;
    throw new TypeError('@@toPrimitive must return a primitive value.');
  }
  return ('string' === r ? String : Number)(t);
}
function _slicedToArray(arr, i) {
  return (
    _arrayWithHoles(arr) ||
    _iterableToArrayLimit(arr, i) ||
    _unsupportedIterableToArray(arr, i) ||
    _nonIterableRest()
  );
}
function _nonIterableRest() {
  throw new TypeError(
    'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
  );
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === 'Object' && o.constructor) n = o.constructor.name;
  if (n === 'Map' || n === 'Set') return Array.from(o);
  if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))
    return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _iterableToArrayLimit(r, l) {
  var t =
    null == r
      ? null
      : ('undefined' != typeof Symbol && r[Symbol.iterator]) || r['@@iterator'];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = !0,
      o = !1;
    try {
      if (((i = (t = t.call(r)).next), 0 === l)) {
        if (Object(t) !== t) return;
        f = !1;
      } else
        for (
          ;
          !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l);
          f = !0
        );
    } catch (r) {
      (o = !0), (n = r);
    } finally {
      try {
        if (!f && null != t.return && ((u = t.return()), Object(u) !== u))
          return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}
const _require = require('./utils'),
  getConfigType = _require.getConfigType,
  extractNativeModuleName = _require.extractNativeModuleName,
  createParserErrorCapturer = _require.createParserErrorCapturer,
  visit = _require.visit,
  isModuleRegistryCall = _require.isModuleRegistryCall,
  verifyPlatforms = _require.verifyPlatforms;
const _require2 = require('./error-utils'),
  throwIfPropertyValueTypeIsUnsupported =
    _require2.throwIfPropertyValueTypeIsUnsupported,
  throwIfUnsupportedFunctionParamTypeAnnotationParserError =
    _require2.throwIfUnsupportedFunctionParamTypeAnnotationParserError,
  throwIfUnsupportedFunctionReturnTypeAnnotationParserError =
    _require2.throwIfUnsupportedFunctionReturnTypeAnnotationParserError,
  throwIfModuleTypeIsUnsupported = _require2.throwIfModuleTypeIsUnsupported,
  throwIfUnusedModuleInterfaceParserError =
    _require2.throwIfUnusedModuleInterfaceParserError,
  throwIfMoreThanOneModuleRegistryCalls =
    _require2.throwIfMoreThanOneModuleRegistryCalls,
  throwIfWrongNumberOfCallExpressionArgs =
    _require2.throwIfWrongNumberOfCallExpressionArgs,
  throwIfUntypedModule = _require2.throwIfUntypedModule,
  throwIfIncorrectModuleRegistryCallTypeParameterParserError =
    _require2.throwIfIncorrectModuleRegistryCallTypeParameterParserError,
  throwIfIncorrectModuleRegistryCallArgument =
    _require2.throwIfIncorrectModuleRegistryCallArgument,
  throwIfModuleInterfaceNotFound = _require2.throwIfModuleInterfaceNotFound,
  throwIfMoreThanOneModuleInterfaceParserError =
    _require2.throwIfMoreThanOneModuleInterfaceParserError,
  throwIfModuleInterfaceIsMisnamed = _require2.throwIfModuleInterfaceIsMisnamed,
  throwIfMoreThanOneCodegenNativecommands =
    _require2.throwIfMoreThanOneCodegenNativecommands,
  throwIfConfigNotfound = _require2.throwIfConfigNotfound,
  throwIfMoreThanOneConfig = _require2.throwIfMoreThanOneConfig,
  throwIfTypeAliasIsNotInterface = _require2.throwIfTypeAliasIsNotInterface;
const _require3 = require('./errors'),
  MissingTypeParameterGenericParserError =
    _require3.MissingTypeParameterGenericParserError,
  MoreThanOneTypeParameterGenericParserError =
    _require3.MoreThanOneTypeParameterGenericParserError,
  UnnamedFunctionParamParserError = _require3.UnnamedFunctionParamParserError;
const invariant = require('invariant');

// $FlowFixMe[unclear-type] TODO(T108222691): Use flow-types for @babel/parser

function wrapModuleSchema(nativeModuleSchema, hasteModuleName) {
  return {
    modules: {
      [hasteModuleName]: nativeModuleSchema,
    },
  };
}

// $FlowFixMe[unsupported-variance-annotation]
function unwrapNullable(x) {
  if (x.type === 'NullableTypeAnnotation') {
    return [x.typeAnnotation, true];
  }
  return [x, false];
}

// $FlowFixMe[unsupported-variance-annotation]
function wrapNullable(nullable, typeAnnotation) {
  if (!nullable) {
    return typeAnnotation;
  }
  return {
    type: 'NullableTypeAnnotation',
    typeAnnotation,
  };
}
function assertGenericTypeAnnotationHasExactlyOneTypeParameter(
  moduleName,
  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  typeAnnotation,
  parser,
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
function isObjectProperty(property, language) {
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
) {
  const language = parser.language();
  const name = parser.getKeyName(property, hasteModuleName);
  const _property$optional = property.optional,
    optional = _property$optional === void 0 ? false : _property$optional;
  const languageTypeAnnotation =
    language === 'TypeScript'
      ? property.typeAnnotation.typeAnnotation
      : property.value;
  const _unwrapNullable = unwrapNullable(
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
    ),
    _unwrapNullable2 = _slicedToArray(_unwrapNullable, 2),
    propertyTypeAnnotation = _unwrapNullable2[0],
    isPropertyNullable = _unwrapNullable2[1];
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
  hasteModuleName,
  // TODO(T108222691): Use flow-types for @babel/parser
  // TODO(T71778680): This is a FunctionTypeAnnotation. Type this.
  functionTypeAnnotation,
  types,
  aliasMap,
  enumMap,
  tryParse,
  cxxOnly,
  translateTypeAnnotation,
  parser,
) {
  const params = [];
  for (const param of parser.getFunctionTypeAnnotationParameters(
    functionTypeAnnotation,
  )) {
    const parsedParam = tryParse(() => {
      if (parser.getFunctionNameFromParameter(param) == null) {
        throw new UnnamedFunctionParamParserError(param, hasteModuleName);
      }
      const paramName = parser.getParameterName(param);
      const _unwrapNullable3 = unwrapNullable(
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
        ),
        _unwrapNullable4 = _slicedToArray(_unwrapNullable3, 2),
        paramTypeAnnotation = _unwrapNullable4[0],
        isParamTypeAnnotationNullable = _unwrapNullable4[1];
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
  const _unwrapNullable5 = unwrapNullable(
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
    ),
    _unwrapNullable6 = _slicedToArray(_unwrapNullable5, 2),
    returnTypeAnnotation = _unwrapNullable6[0],
    isReturnTypeAnnotationNullable = _unwrapNullable6[1];
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
  hasteModuleName,
  // TODO(T108222691): [TS] Use flow-types for @babel/parser
  // TODO(T71778680): [Flow] This is an ObjectTypeProperty containing either:
  // - a FunctionTypeAnnotation or GenericTypeAnnotation
  // - a NullableTypeAnnoation containing a FunctionTypeAnnotation or GenericTypeAnnotation
  // Flow type this node
  property,
  types,
  aliasMap,
  enumMap,
  tryParse,
  cxxOnly,
  translateTypeAnnotation,
  parser,
) {
  let nullable = false;
  let key = property.key,
    value = property.value;
  const methodName = key.name;
  if (parser.language() === 'TypeScript') {
    value =
      property.type === 'TSMethodSignature'
        ? property
        : property.typeAnnotation;
  }
  const resolveTypeAnnotationFN = parser.getResolveTypeAnnotationFN();
  var _resolveTypeAnnotatio = resolveTypeAnnotationFN(value, types, parser);
  nullable = _resolveTypeAnnotatio.nullable;
  value = _resolveTypeAnnotatio.typeAnnotation;
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
  configType,
  filename,
  ast,
  wrapComponentSchema,
  buildComponentSchema,
  buildModuleSchema,
  parser,
  translateTypeAnnotation,
) {
  switch (configType) {
    case 'component': {
      return wrapComponentSchema(buildComponentSchema(ast, parser));
    }
    case 'module': {
      if (filename === undefined || filename === null) {
        throw new Error('Filepath expected while parasing a module');
      }
      const nativeModuleName = extractNativeModuleName(filename);
      const _createParserErrorCap = createParserErrorCapturer(),
        _createParserErrorCap2 = _slicedToArray(_createParserErrorCap, 2),
        parsingErrors = _createParserErrorCap2[0],
        tryParse = _createParserErrorCap2[1];
      const schema = tryParse(() =>
        buildModuleSchema(
          nativeModuleName,
          ast,
          tryParse,
          parser,
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
      return {
        modules: {},
      };
  }
}
function buildSchema(
  contents,
  filename,
  wrapComponentSchema,
  buildComponentSchema,
  buildModuleSchema,
  Visitor,
  parser,
  translateTypeAnnotation,
) {
  // Early return for non-Spec JavaScript files
  if (
    !contents.includes('codegenNativeComponent') &&
    !contents.includes('TurboModule')
  ) {
    return {
      modules: {},
    };
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
    translateTypeAnnotation,
  );
}
function createComponentConfig(foundConfig, commandsTypeNames) {
  return _objectSpread(
    _objectSpread({}, foundConfig),
    {},
    {
      commandTypeName:
        commandsTypeNames[0] == null
          ? null
          : commandsTypeNames[0].commandTypeName,
      commandOptionsExpression:
        commandsTypeNames[0] == null
          ? null
          : commandsTypeNames[0].commandOptionsExpression,
    },
  );
}
const parseModuleName = (hasteModuleName, moduleSpec, ast, parser) => {
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
  const callExpression = callExpressions[0];
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
  hasteModuleName,
  ast,
  tryParse,
  parser,
  translateTypeAnnotation,
) => {
  const language = parser.language();
  const types = parser.getTypes(ast);
  const moduleSpecs = Object.values(types).filter(t =>
    parser.isModuleInterface(t),
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
  const _moduleSpecs = _slicedToArray(moduleSpecs, 1),
    moduleSpec = _moduleSpecs[0];
  throwIfModuleInterfaceIsMisnamed(hasteModuleName, moduleSpec.id, language);

  // Parse Module Name
  const moduleName = parseModuleName(hasteModuleName, moduleSpec, ast, parser);

  // Some module names use platform suffix to indicate platform-exclusive modules.
  // Eventually this should be made explicit in the Flow type itself.
  // Also check the hasteModuleName for platform suffix.
  // Note: this shape is consistent with ComponentSchema.
  const _verifyPlatforms = verifyPlatforms(hasteModuleName, moduleName),
    cxxOnly = _verifyPlatforms.cxxOnly,
    excludedPlatforms = _verifyPlatforms.excludedPlatforms;
  const properties =
    language === 'Flow' ? moduleSpec.body.properties : moduleSpec.body.body;

  // $FlowFixMe[missing-type-arg]
  return properties
    .filter(
      property =>
        property.type === 'ObjectTypeProperty' ||
        property.type === 'TSPropertySignature' ||
        property.type === 'TSMethodSignature',
    )
    .map(property => {
      const aliasMap = {};
      const enumMap = {};
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
          translateTypeAnnotation,
          parser,
        ),
      }));
    })
    .filter(Boolean)
    .reduce(
      (moduleSchema, {aliasMap, enumMap, propertyShape}) => ({
        type: 'NativeModule',
        aliasMap: _objectSpread(
          _objectSpread({}, moduleSchema.aliasMap),
          aliasMap,
        ),
        enumMap: _objectSpread(
          _objectSpread({}, moduleSchema.enumMap),
          enumMap,
        ),
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
        spec: {
          properties: [],
        },
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
function findNativeComponentType(statement, foundConfigs, parser) {
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
      const nativeComponentType = parser.getNativeComponentType(
        typeArgumentParams,
        funcArgumentParams,
      );
      if (funcArgumentParams.length > 1) {
        nativeComponentType.optionsExpression = funcArgumentParams[1];
      }
      foundConfigs.push(nativeComponentType);
    }
  } catch (e) {
    // ignore
  }
}
function getCommandOptions(commandOptionsExpression) {
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
function getOptions(optionsExpression) {
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
function getCommandTypeNameAndOptionsExpression(namedExport, parser) {
  let callExpression;
  let calleeName;
  try {
    callExpression = namedExport.declaration.declarations[0].init;
    calleeName = callExpression.callee.name;
  } catch (e) {
    return;
  }
  if (calleeName !== 'codegenNativeCommands') {
    return;
  }
  if (callExpression.arguments.length !== 1) {
    throw new Error(
      'codegenNativeCommands must be passed options including the supported commands',
    );
  }
  const typeArgumentParam =
    parser.getTypeArgumentParamsFromDeclaration(callExpression)[0];
  if (!parser.isGenericTypeAnnotation(typeArgumentParam.type)) {
    throw new Error(
      "codegenNativeCommands doesn't support inline definitions. Specify a file local type alias",
    );
  }
  return {
    commandTypeName: parser.getTypeAnnotationName(typeArgumentParam),
    commandOptionsExpression: callExpression.arguments[0],
  };
}
function propertyNames(properties) {
  return properties
    .map(property => property && property.key && property.key.name)
    .filter(Boolean);
}
function extendsForProp(prop, types, parser) {
  const argument = parser.argumentForProp(prop);
  if (!argument) {
    console.log('null', prop);
  }
  const name = parser.nameForArgument(prop);
  if (types[name] != null) {
    // This type is locally defined in the file
    return null;
  }
  switch (name) {
    case 'ViewProps':
      return {
        type: 'ReactNativeBuiltInType',
        knownTypeName: 'ReactNativeCoreViewProps',
      };
    default: {
      throw new Error(`Unable to handle prop spread: ${name}`);
    }
  }
}
function buildPropSchema(property, types, parser) {
  const getSchemaInfoFN = parser.getGetSchemaInfoFN();
  const info = getSchemaInfoFN(property, types);
  if (info == null) {
    return null;
  }
  const name = info.name,
    optional = info.optional,
    typeAnnotation = info.typeAnnotation,
    defaultValue = info.defaultValue,
    withNullDefault = info.withNullDefault;
  const getTypeAnnotationFN = parser.getGetTypeAnnotationFN();
  return {
    name,
    optional,
    typeAnnotation: getTypeAnnotationFN(
      name,
      typeAnnotation,
      defaultValue,
      withNullDefault,
      types,
      parser,
      buildPropSchema,
    ),
  };
}

/* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
 * LTI update could not be added via codemod */
function getEventArgument(argumentProps, parser, getPropertyType) {
  return {
    type: 'ObjectTypeAnnotation',
    properties: argumentProps.map(member =>
      buildPropertiesForEvent(member, parser, getPropertyType),
    ),
  };
}

/* $FlowFixMe[signature-verification-failure] there's no flowtype for AST.
 * TODO(T108222691): Use flow-types for @babel/parser */
function findComponentConfig(ast, parser) {
  const foundConfigs = [];
  const defaultExports = ast.body.filter(
    node => node.type === 'ExportDefaultDeclaration',
  );
  defaultExports.forEach(statement => {
    findNativeComponentType(statement, foundConfigs, parser);
  });
  throwIfConfigNotfound(foundConfigs);
  throwIfMoreThanOneConfig(foundConfigs);
  const foundConfig = foundConfigs[0];
  const namedExports = ast.body.filter(
    node => node.type === 'ExportNamedDeclaration',
  );
  const commandsTypeNames = namedExports
    .map(statement => getCommandTypeNameAndOptionsExpression(statement, parser))
    .filter(Boolean);
  throwIfMoreThanOneCodegenNativecommands(commandsTypeNames);
  return createComponentConfig(foundConfig, commandsTypeNames);
}

// $FlowFixMe[signature-verification-failure] there's no flowtype for AST
function getCommandProperties(ast, parser) {
  const _findComponentConfig = findComponentConfig(ast, parser),
    commandTypeName = _findComponentConfig.commandTypeName,
    commandOptionsExpression = _findComponentConfig.commandOptionsExpression;
  if (commandTypeName == null) {
    return [];
  }
  const types = parser.getTypes(ast);
  const typeAlias = types[commandTypeName];
  throwIfTypeAliasIsNotInterface(typeAlias, parser);
  const properties = parser.bodyProperties(typeAlias);
  if (!properties) {
    throw new Error(
      `Failed to find type definition for "${commandTypeName}", please check that you have a valid codegen file`,
    );
  }
  const commandPropertyNames = propertyNames(properties);
  const commandOptions = getCommandOptions(commandOptionsExpression);
  if (commandOptions == null || commandOptions.supportedCommands == null) {
    throw new Error(
      'codegenNativeCommands must be given an options object with supportedCommands array',
    );
  }
  if (
    commandOptions.supportedCommands.length !== commandPropertyNames.length ||
    !commandOptions.supportedCommands.every(supportedCommand =>
      commandPropertyNames.includes(supportedCommand),
    )
  ) {
    throw new Error(
      `codegenNativeCommands expected the same supportedCommands specified in the ${commandTypeName} interface: ${commandPropertyNames.join(
        ', ',
      )}`,
    );
  }
  return properties;
}
function getTypeResolutionStatus(type, typeAnnotation, parser) {
  return {
    successful: true,
    type,
    name: parser.getTypeAnnotationName(typeAnnotation),
  };
}
function handleGenericTypeAnnotation(
  typeAnnotation,
  resolvedTypeAnnotation,
  parser,
) {
  let typeResolutionStatus;
  let node;
  switch (resolvedTypeAnnotation.type) {
    case parser.typeAlias: {
      typeResolutionStatus = getTypeResolutionStatus(
        'alias',
        typeAnnotation,
        parser,
      );
      node = parser.nextNodeForTypeAlias(resolvedTypeAnnotation);
      break;
    }
    case parser.enumDeclaration: {
      typeResolutionStatus = getTypeResolutionStatus(
        'enum',
        typeAnnotation,
        parser,
      );
      node = parser.nextNodeForEnum(resolvedTypeAnnotation);
      break;
    }
    // parser.interfaceDeclaration is not used here because for flow it should fall through to default case and throw an error
    case 'TSInterfaceDeclaration': {
      typeResolutionStatus = getTypeResolutionStatus(
        'alias',
        typeAnnotation,
        parser,
      );
      node = resolvedTypeAnnotation;
      break;
    }
    default: {
      throw new TypeError(
        parser.genericTypeAnnotationErrorMessage(resolvedTypeAnnotation),
      );
    }
  }
  return {
    typeAnnotation: node,
    typeResolutionStatus,
  };
}
function buildPropertiesForEvent(property, parser, getPropertyType) {
  const name = property.key.name;
  const optional = parser.isOptionalProperty(property);
  const typeAnnotation = parser.getTypeAnnotationFromProperty(property);
  return getPropertyType(name, optional, typeAnnotation, parser);
}
function verifyPropNotAlreadyDefined(props, needleProp) {
  const propName = needleProp.key.name;
  const foundProp = props.some(prop => prop.key.name === propName);
  if (foundProp) {
    throw new Error(`A prop was already defined with the name ${propName}`);
  }
}
function handleEventHandler(
  name,
  typeAnnotation,
  parser,
  types,
  findEventArgumentsAndType,
) {
  const eventType = name === 'BubblingEventHandler' ? 'bubble' : 'direct';
  const paperTopLevelNameDeprecated =
    parser.getPaperTopLevelNameDeprecated(typeAnnotation);
  switch (typeAnnotation.typeParameters.params[0].type) {
    case parser.nullLiteralTypeAnnotation:
    case parser.undefinedLiteralTypeAnnotation:
      return {
        argumentProps: [],
        bubblingType: eventType,
        paperTopLevelNameDeprecated,
      };
    default:
      return findEventArgumentsAndType(
        parser,
        typeAnnotation.typeParameters.params[0],
        types,
        eventType,
        paperTopLevelNameDeprecated,
      );
  }
}
function emitBuildEventSchema(
  paperTopLevelNameDeprecated,
  name,
  optional,
  nonNullableBubblingType,
  argument,
) {
  if (paperTopLevelNameDeprecated != null) {
    return {
      name,
      optional,
      bubblingType: nonNullableBubblingType,
      paperTopLevelNameDeprecated,
      typeAnnotation: {
        type: 'EventTypeAnnotation',
        argument: argument,
      },
    };
  }
  return {
    name,
    optional,
    bubblingType: nonNullableBubblingType,
    typeAnnotation: {
      type: 'EventTypeAnnotation',
      argument: argument,
    },
  };
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
  propertyNames,
  getCommandOptions,
  getOptions,
  getCommandTypeNameAndOptionsExpression,
  extendsForProp,
  buildPropSchema,
  getEventArgument,
  findComponentConfig,
  getCommandProperties,
  handleGenericTypeAnnotation,
  getTypeResolutionStatus,
  buildPropertiesForEvent,
  verifyPropNotAlreadyDefined,
  handleEventHandler,
  emitBuildEventSchema,
};
