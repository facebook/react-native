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
const invariant = require('invariant');
const _require = require('./modules'),
  typeScriptTranslateTypeAnnotation =
    _require.typeScriptTranslateTypeAnnotation;

// $FlowFixMe[untyped-import] Use flow-types for @babel/parser
const babelParser = require('@babel/parser');
const _require2 = require('../parsers-primitives'),
  Visitor = _require2.Visitor;
const _require3 = require('./components'),
  buildComponentSchema = _require3.buildComponentSchema;
const _require4 = require('../schema.js'),
  wrapComponentSchema = _require4.wrapComponentSchema;
const _require5 = require('../parsers-commons.js'),
  buildSchema = _require5.buildSchema,
  buildModuleSchema = _require5.buildModuleSchema,
  extendsForProp = _require5.extendsForProp,
  buildPropSchema = _require5.buildPropSchema,
  handleGenericTypeAnnotation = _require5.handleGenericTypeAnnotation;
const _require6 = require('./parseTopLevelType'),
  parseTopLevelType = _require6.parseTopLevelType;
const _require7 = require('./components/componentsUtils'),
  getSchemaInfo = _require7.getSchemaInfo,
  getTypeAnnotation = _require7.getTypeAnnotation,
  flattenProperties = _require7.flattenProperties;
const fs = require('fs');
const _require8 = require('../errors'),
  UnsupportedObjectPropertyTypeAnnotationParserError =
    _require8.UnsupportedObjectPropertyTypeAnnotationParserError;
class TypeScriptParser {
  constructor() {
    _defineProperty(
      this,
      'typeParameterInstantiation',
      'TSTypeParameterInstantiation',
    );
    _defineProperty(this, 'typeAlias', 'TSTypeAliasDeclaration');
    _defineProperty(this, 'enumDeclaration', 'TSEnumDeclaration');
    _defineProperty(this, 'interfaceDeclaration', 'TSInterfaceDeclaration');
    _defineProperty(this, 'nullLiteralTypeAnnotation', 'TSNullKeyword');
    _defineProperty(
      this,
      'undefinedLiteralTypeAnnotation',
      'TSUndefinedKeyword',
    );
  }
  isProperty(property) {
    return property.type === 'TSPropertySignature';
  }
  getKeyName(property, hasteModuleName) {
    if (!this.isProperty(property)) {
      throw new UnsupportedObjectPropertyTypeAnnotationParserError(
        hasteModuleName,
        property,
        property.type,
        this.language(),
      );
    }
    return property.key.name;
  }
  language() {
    return 'TypeScript';
  }
  getTypeAnnotationName(typeAnnotation) {
    var _typeAnnotation$typeN;
    return typeAnnotation === null || typeAnnotation === void 0
      ? void 0
      : (_typeAnnotation$typeN = typeAnnotation.typeName) === null ||
        _typeAnnotation$typeN === void 0
      ? void 0
      : _typeAnnotation$typeN.name;
  }
  checkIfInvalidModule(typeArguments) {
    return (
      typeArguments.type !== 'TSTypeParameterInstantiation' ||
      typeArguments.params.length !== 1 ||
      typeArguments.params[0].type !== 'TSTypeReference' ||
      typeArguments.params[0].typeName.name !== 'Spec'
    );
  }
  remapUnionTypeAnnotationMemberNames(membersTypes) {
    const remapLiteral = item => {
      return item.literal
        ? item.literal.type
            .replace('NumericLiteral', 'NumberTypeAnnotation')
            .replace('StringLiteral', 'StringTypeAnnotation')
        : 'ObjectTypeAnnotation';
    };
    return [...new Set(membersTypes.map(remapLiteral))];
  }
  parseFile(filename) {
    const contents = fs.readFileSync(filename, 'utf8');
    return this.parseString(contents, filename);
  }
  parseString(contents, filename) {
    return buildSchema(
      contents,
      filename,
      wrapComponentSchema,
      buildComponentSchema,
      buildModuleSchema,
      Visitor,
      this,
      typeScriptTranslateTypeAnnotation,
    );
  }
  parseModuleFixture(filename) {
    const contents = fs.readFileSync(filename, 'utf8');
    return this.parseString(contents, 'path/NativeSampleTurboModule.ts');
  }
  getAst(contents) {
    return babelParser.parse(contents, {
      sourceType: 'module',
      plugins: ['typescript'],
    }).program;
  }
  getFunctionTypeAnnotationParameters(functionTypeAnnotation) {
    return functionTypeAnnotation.parameters;
  }
  getFunctionNameFromParameter(parameter) {
    return parameter.typeAnnotation;
  }
  getParameterName(parameter) {
    return parameter.name;
  }
  getParameterTypeAnnotation(parameter) {
    return parameter.typeAnnotation.typeAnnotation;
  }
  getFunctionTypeAnnotationReturnType(functionTypeAnnotation) {
    return functionTypeAnnotation.typeAnnotation.typeAnnotation;
  }
  parseEnumMembersType(typeAnnotation) {
    var _typeAnnotation$membe;
    const enumInitializer =
      (_typeAnnotation$membe = typeAnnotation.members[0]) === null ||
      _typeAnnotation$membe === void 0
        ? void 0
        : _typeAnnotation$membe.initializer;
    const enumMembersType =
      !enumInitializer || enumInitializer.type === 'StringLiteral'
        ? 'StringTypeAnnotation'
        : enumInitializer.type === 'NumericLiteral'
        ? 'NumberTypeAnnotation'
        : null;
    if (!enumMembersType) {
      throw new Error(
        'Enum values must be either blank, number, or string values.',
      );
    }
    return enumMembersType;
  }
  validateEnumMembersSupported(typeAnnotation, enumMembersType) {
    if (!typeAnnotation.members || typeAnnotation.members.length === 0) {
      throw new Error('Enums should have at least one member.');
    }
    const enumInitializerType =
      enumMembersType === 'StringTypeAnnotation'
        ? 'StringLiteral'
        : enumMembersType === 'NumberTypeAnnotation'
        ? 'NumericLiteral'
        : null;
    typeAnnotation.members.forEach(member => {
      var _member$initializer$t, _member$initializer;
      if (
        ((_member$initializer$t =
          (_member$initializer = member.initializer) === null ||
          _member$initializer === void 0
            ? void 0
            : _member$initializer.type) !== null &&
        _member$initializer$t !== void 0
          ? _member$initializer$t
          : 'StringLiteral') !== enumInitializerType
      ) {
        throw new Error(
          'Enum values can not be mixed. They all must be either blank, number, or string values.',
        );
      }
    });
  }
  parseEnumMembers(typeAnnotation) {
    return typeAnnotation.members.map(member => {
      var _member$initializer$v, _member$initializer2;
      return {
        name: member.id.name,
        value:
          (_member$initializer$v =
            (_member$initializer2 = member.initializer) === null ||
            _member$initializer2 === void 0
              ? void 0
              : _member$initializer2.value) !== null &&
          _member$initializer$v !== void 0
            ? _member$initializer$v
            : member.id.name,
      };
    });
  }
  isModuleInterface(node) {
    var _node$extends;
    return (
      node.type === 'TSInterfaceDeclaration' &&
      ((_node$extends = node.extends) === null || _node$extends === void 0
        ? void 0
        : _node$extends.length) === 1 &&
      node.extends[0].type === 'TSExpressionWithTypeArguments' &&
      node.extends[0].expression.name === 'TurboModule'
    );
  }
  isGenericTypeAnnotation(type) {
    return type === 'TSTypeReference';
  }
  extractAnnotatedElement(typeAnnotation, types) {
    return types[typeAnnotation.typeParameters.params[0].typeName.name];
  }

  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  getTypes(ast) {
    return ast.body.reduce((types, node) => {
      switch (node.type) {
        case 'ExportNamedDeclaration': {
          if (node.declaration) {
            switch (node.declaration.type) {
              case 'TSTypeAliasDeclaration':
              case 'TSInterfaceDeclaration':
              case 'TSEnumDeclaration': {
                types[node.declaration.id.name] = node.declaration;
                break;
              }
            }
          }
          break;
        }
        case 'TSTypeAliasDeclaration':
        case 'TSInterfaceDeclaration':
        case 'TSEnumDeclaration': {
          types[node.id.name] = node;
          break;
        }
      }
      return types;
    }, {});
  }
  callExpressionTypeParameters(callExpression) {
    return callExpression.typeParameters || null;
  }
  computePartialProperties(
    properties,
    hasteModuleName,
    types,
    aliasMap,
    enumMap,
    tryParse,
    cxxOnly,
  ) {
    return properties.map(prop => {
      return {
        name: prop.key.name,
        optional: true,
        typeAnnotation: typeScriptTranslateTypeAnnotation(
          hasteModuleName,
          prop.typeAnnotation.typeAnnotation,
          types,
          aliasMap,
          enumMap,
          tryParse,
          cxxOnly,
          this,
        ),
      };
    });
  }
  functionTypeAnnotation(propertyValueType) {
    return (
      propertyValueType === 'TSFunctionType' ||
      propertyValueType === 'TSMethodSignature'
    );
  }
  getTypeArgumentParamsFromDeclaration(declaration) {
    return declaration.typeParameters.params;
  }

  // This FlowFixMe is supposed to refer to typeArgumentParams and funcArgumentParams of generated AST.
  getNativeComponentType(typeArgumentParams, funcArgumentParams) {
    return {
      propsTypeName: typeArgumentParams[0].typeName.name,
      componentName: funcArgumentParams[0].value,
    };
  }
  getAnnotatedElementProperties(annotatedElement) {
    return annotatedElement.typeAnnotation.members;
  }
  bodyProperties(typeAlias) {
    return typeAlias.body.body;
  }
  convertKeywordToTypeAnnotation(keyword) {
    switch (keyword) {
      case 'TSBooleanKeyword':
        return 'BooleanTypeAnnotation';
      case 'TSNumberKeyword':
        return 'NumberTypeAnnotation';
      case 'TSVoidKeyword':
        return 'VoidTypeAnnotation';
      case 'TSStringKeyword':
        return 'StringTypeAnnotation';
      case 'TSUnknownKeyword':
        return 'MixedTypeAnnotation';
    }
    return keyword;
  }
  argumentForProp(prop) {
    return prop.expression;
  }
  nameForArgument(prop) {
    return prop.expression.name;
  }
  isOptionalProperty(property) {
    return property.optional || false;
  }
  getGetSchemaInfoFN() {
    return getSchemaInfo;
  }
  getTypeAnnotationFromProperty(property) {
    return property.typeAnnotation.typeAnnotation;
  }
  getGetTypeAnnotationFN() {
    return getTypeAnnotation;
  }
  getResolvedTypeAnnotation(
    // TODO(T108222691): Use flow-types for @babel/parser
    typeAnnotation,
    types,
    parser,
  ) {
    invariant(
      typeAnnotation != null,
      'resolveTypeAnnotation(): typeAnnotation cannot be null',
    );
    let node =
      typeAnnotation.type === 'TSTypeAnnotation'
        ? typeAnnotation.typeAnnotation
        : typeAnnotation;
    let nullable = false;
    let typeResolutionStatus = {
      successful: false,
    };
    for (;;) {
      const topLevelType = parseTopLevelType(node);
      nullable = nullable || topLevelType.optional;
      node = topLevelType.type;
      if (node.type !== 'TSTypeReference') {
        break;
      }
      const typeAnnotationName = this.getTypeAnnotationName(node);
      const resolvedTypeAnnotation = types[typeAnnotationName];
      if (resolvedTypeAnnotation == null) {
        break;
      }
      const _handleGenericTypeAnn = handleGenericTypeAnnotation(
          node,
          resolvedTypeAnnotation,
          this,
        ),
        typeAnnotationNode = _handleGenericTypeAnn.typeAnnotation,
        status = _handleGenericTypeAnn.typeResolutionStatus;
      typeResolutionStatus = status;
      node = typeAnnotationNode;
    }
    return {
      nullable: nullable,
      typeAnnotation: node,
      typeResolutionStatus,
    };
  }
  getResolveTypeAnnotationFN() {
    return (typeAnnotation, types, parser) => {
      return this.getResolvedTypeAnnotation(typeAnnotation, types, parser);
    };
  }
  isEvent(typeAnnotation) {
    if (typeAnnotation.type !== 'TSTypeReference') {
      return false;
    }
    const eventNames = new Set(['BubblingEventHandler', 'DirectEventHandler']);
    return eventNames.has(this.getTypeAnnotationName(typeAnnotation));
  }
  isProp(name, typeAnnotation) {
    if (typeAnnotation.type !== 'TSTypeReference') {
      return true;
    }
    const isStyle =
      name === 'style' &&
      typeAnnotation.type === 'GenericTypeAnnotation' &&
      this.getTypeAnnotationName(typeAnnotation) === 'ViewStyleProp';
    return !isStyle;
  }
  getProps(typeDefinition, types) {
    const extendsProps = [];
    const componentPropAsts = [];
    const remaining = [];
    for (const prop of typeDefinition) {
      // find extends
      if (prop.type === 'TSExpressionWithTypeArguments') {
        const extend = extendsForProp(prop, types, this);
        if (extend) {
          extendsProps.push(extend);
          continue;
        }
      }
      remaining.push(prop);
    }

    // find events and props
    for (const prop of flattenProperties(remaining, types, this)) {
      const topLevelType = parseTopLevelType(
        prop.typeAnnotation.typeAnnotation,
        types,
      );
      if (
        prop.type === 'TSPropertySignature' &&
        !this.isEvent(topLevelType.type) &&
        this.isProp(prop.key.name, prop)
      ) {
        componentPropAsts.push(prop);
      }
    }
    return {
      props: componentPropAsts
        .map(property => buildPropSchema(property, types, this))
        .filter(Boolean),
      extendsProps,
    };
  }
  getProperties(typeName, types) {
    const alias = types[typeName];
    if (!alias) {
      throw new Error(
        `Failed to find definition for "${typeName}", please check that you have a valid codegen typescript file`,
      );
    }
    const aliasKind =
      alias.type === 'TSInterfaceDeclaration' ? 'interface' : 'type';
    try {
      if (aliasKind === 'interface') {
        var _alias$extends;
        return [
          ...((_alias$extends = alias.extends) !== null &&
          _alias$extends !== void 0
            ? _alias$extends
            : []),
          ...alias.body.body,
        ];
      }
      return (
        alias.typeAnnotation.members ||
        alias.typeAnnotation.typeParameters.params[0].members ||
        alias.typeAnnotation.typeParameters.params
      );
    } catch (e) {
      throw new Error(
        `Failed to find ${aliasKind} definition for "${typeName}", please check that you have a valid codegen typescript file`,
      );
    }
  }
  nextNodeForTypeAlias(typeAnnotation) {
    return typeAnnotation.typeAnnotation;
  }
  nextNodeForEnum(typeAnnotation) {
    return typeAnnotation;
  }
  genericTypeAnnotationErrorMessage(typeAnnotation) {
    return `A non GenericTypeAnnotation must be a type declaration ('${this.typeAlias}'), an interface ('${this.interfaceDeclaration}'), or enum ('${this.enumDeclaration}'). Instead, got the unsupported ${typeAnnotation.type}.`;
  }
  extractTypeFromTypeAnnotation(typeAnnotation) {
    return typeAnnotation.type === 'TSTypeReference'
      ? typeAnnotation.typeName.name
      : typeAnnotation.type;
  }
  getObjectProperties(typeAnnotation) {
    return typeAnnotation.members;
  }
  getLiteralValue(option) {
    return option.literal.value;
  }
  getPaperTopLevelNameDeprecated(typeAnnotation) {
    return typeAnnotation.typeParameters.params.length > 1
      ? typeAnnotation.typeParameters.params[1].literal.value
      : null;
  }
}
module.exports = {
  TypeScriptParser,
};
