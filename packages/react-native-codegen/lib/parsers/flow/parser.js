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
const _require = require('./components/componentsUtils'),
  getSchemaInfo = _require.getSchemaInfo,
  getTypeAnnotation = _require.getTypeAnnotation,
  flattenProperties = _require.flattenProperties;
const _require2 = require('./modules'),
  flowTranslateTypeAnnotation = _require2.flowTranslateTypeAnnotation;

// $FlowFixMe[untyped-import] there's no flowtype flow-parser
const flowParser = require('flow-parser');
const _require3 = require('../parsers-commons'),
  buildSchema = _require3.buildSchema,
  buildPropSchema = _require3.buildPropSchema,
  buildModuleSchema = _require3.buildModuleSchema,
  handleGenericTypeAnnotation = _require3.handleGenericTypeAnnotation;
const _require4 = require('../parsers-primitives'),
  Visitor = _require4.Visitor;
const _require5 = require('./components'),
  buildComponentSchema = _require5.buildComponentSchema;
const _require6 = require('../schema.js'),
  wrapComponentSchema = _require6.wrapComponentSchema;
const fs = require('fs');
const _require7 = require('../errors'),
  UnsupportedObjectPropertyTypeAnnotationParserError =
    _require7.UnsupportedObjectPropertyTypeAnnotationParserError;
class FlowParser {
  constructor() {
    _defineProperty(
      this,
      'typeParameterInstantiation',
      'TypeParameterInstantiation',
    );
    _defineProperty(this, 'typeAlias', 'TypeAlias');
    _defineProperty(this, 'enumDeclaration', 'EnumDeclaration');
    _defineProperty(this, 'interfaceDeclaration', 'InterfaceDeclaration');
    _defineProperty(
      this,
      'nullLiteralTypeAnnotation',
      'NullLiteralTypeAnnotation',
    );
    _defineProperty(
      this,
      'undefinedLiteralTypeAnnotation',
      'VoidLiteralTypeAnnotation',
    );
  }
  isProperty(property) {
    return property.type === 'ObjectTypeProperty';
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
    return 'Flow';
  }
  getTypeAnnotationName(typeAnnotation) {
    var _typeAnnotation$id;
    return typeAnnotation === null || typeAnnotation === void 0
      ? void 0
      : (_typeAnnotation$id = typeAnnotation.id) === null ||
        _typeAnnotation$id === void 0
      ? void 0
      : _typeAnnotation$id.name;
  }
  checkIfInvalidModule(typeArguments) {
    return (
      typeArguments.type !== 'TypeParameterInstantiation' ||
      typeArguments.params.length !== 1 ||
      typeArguments.params[0].type !== 'GenericTypeAnnotation' ||
      typeArguments.params[0].id.name !== 'Spec'
    );
  }
  remapUnionTypeAnnotationMemberNames(membersTypes) {
    const remapLiteral = item => {
      return item.type
        .replace('NumberLiteralTypeAnnotation', 'NumberTypeAnnotation')
        .replace('StringLiteralTypeAnnotation', 'StringTypeAnnotation');
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
      flowTranslateTypeAnnotation,
    );
  }
  parseModuleFixture(filename) {
    const contents = fs.readFileSync(filename, 'utf8');
    return this.parseString(contents, 'path/NativeSampleTurboModule.js');
  }
  getAst(contents) {
    return flowParser.parse(contents, {
      enums: true,
    });
  }
  getFunctionTypeAnnotationParameters(functionTypeAnnotation) {
    return functionTypeAnnotation.params;
  }
  getFunctionNameFromParameter(parameter) {
    return parameter.name;
  }
  getParameterName(parameter) {
    return parameter.name.name;
  }
  getParameterTypeAnnotation(parameter) {
    return parameter.typeAnnotation;
  }
  getFunctionTypeAnnotationReturnType(functionTypeAnnotation) {
    return functionTypeAnnotation.returnType;
  }
  parseEnumMembersType(typeAnnotation) {
    const enumMembersType =
      typeAnnotation.type === 'EnumStringBody'
        ? 'StringTypeAnnotation'
        : typeAnnotation.type === 'EnumNumberBody'
        ? 'NumberTypeAnnotation'
        : null;
    if (!enumMembersType) {
      throw new Error(
        `Unknown enum type annotation type. Got: ${typeAnnotation.type}. Expected: EnumStringBody or EnumNumberBody.`,
      );
    }
    return enumMembersType;
  }
  validateEnumMembersSupported(typeAnnotation, enumMembersType) {
    if (!typeAnnotation.members || typeAnnotation.members.length === 0) {
      // passing mixed members to flow would result in a flow error
      // if the tool is launched ignoring that error, the enum would appear like not having enums
      throw new Error(
        'Enums should have at least one member and member values can not be mixed- they all must be either blank, number, or string values.',
      );
    }
    typeAnnotation.members.forEach(member => {
      if (
        enumMembersType === 'StringTypeAnnotation' &&
        (!member.init || typeof member.init.value === 'string')
      ) {
        return;
      }
      if (
        enumMembersType === 'NumberTypeAnnotation' &&
        member.init &&
        typeof member.init.value === 'number'
      ) {
        return;
      }
      throw new Error(
        'Enums can not be mixed- they all must be either blank, number, or string values.',
      );
    });
  }
  parseEnumMembers(typeAnnotation) {
    return typeAnnotation.members.map(member => {
      var _member$init$value, _member$init;
      return {
        name: member.id.name,
        value:
          (_member$init$value =
            (_member$init = member.init) === null || _member$init === void 0
              ? void 0
              : _member$init.value) !== null && _member$init$value !== void 0
            ? _member$init$value
            : member.id.name,
      };
    });
  }
  isModuleInterface(node) {
    return (
      node.type === 'InterfaceDeclaration' &&
      node.extends.length === 1 &&
      node.extends[0].type === 'InterfaceExtends' &&
      node.extends[0].id.name === 'TurboModule'
    );
  }
  isGenericTypeAnnotation(type) {
    return type === 'GenericTypeAnnotation';
  }
  extractAnnotatedElement(typeAnnotation, types) {
    return types[typeAnnotation.typeParameters.params[0].id.name];
  }

  /**
   * This FlowFixMe is supposed to refer to an InterfaceDeclaration or TypeAlias
   * declaration type. Unfortunately, we don't have those types, because flow-parser
   * generates them, and flow-parser is not type-safe. In the future, we should find
   * a way to get these types from our flow parser library.
   *
   * TODO(T71778680): Flow type AST Nodes
   */

  getTypes(ast) {
    return ast.body.reduce((types, node) => {
      if (
        node.type === 'ExportNamedDeclaration' &&
        node.exportKind === 'type'
      ) {
        if (
          node.declaration != null &&
          (node.declaration.type === 'TypeAlias' ||
            node.declaration.type === 'InterfaceDeclaration')
        ) {
          types[node.declaration.id.name] = node.declaration;
        }
      } else if (
        node.type === 'ExportNamedDeclaration' &&
        node.exportKind === 'value' &&
        node.declaration &&
        node.declaration.type === 'EnumDeclaration'
      ) {
        types[node.declaration.id.name] = node.declaration;
      } else if (
        node.type === 'TypeAlias' ||
        node.type === 'InterfaceDeclaration' ||
        node.type === 'EnumDeclaration'
      ) {
        types[node.id.name] = node;
      }
      return types;
    }, {});
  }
  callExpressionTypeParameters(callExpression) {
    return callExpression.typeArguments || null;
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
        typeAnnotation: flowTranslateTypeAnnotation(
          hasteModuleName,
          prop.value,
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
    return propertyValueType === 'FunctionTypeAnnotation';
  }
  getTypeArgumentParamsFromDeclaration(declaration) {
    return declaration.typeArguments.params;
  }

  /**
   * This FlowFixMe is supposed to refer to typeArgumentParams and
   * funcArgumentParams of generated AST.
   */
  getNativeComponentType(typeArgumentParams, funcArgumentParams) {
    return {
      propsTypeName: typeArgumentParams[0].id.name,
      componentName: funcArgumentParams[0].value,
    };
  }
  getAnnotatedElementProperties(annotatedElement) {
    return annotatedElement.right.properties;
  }
  bodyProperties(typeAlias) {
    return typeAlias.body.properties;
  }
  convertKeywordToTypeAnnotation(keyword) {
    return keyword;
  }
  argumentForProp(prop) {
    return prop.argument;
  }
  nameForArgument(prop) {
    return prop.argument.id.name;
  }
  isOptionalProperty(property) {
    return (
      property.value.type === 'NullableTypeAnnotation' || property.optional
    );
  }
  getGetSchemaInfoFN() {
    return getSchemaInfo;
  }
  getTypeAnnotationFromProperty(property) {
    return property.value.type === 'NullableTypeAnnotation'
      ? property.value.typeAnnotation
      : property.value;
  }
  getGetTypeAnnotationFN() {
    return getTypeAnnotation;
  }
  getResolvedTypeAnnotation(typeAnnotation, types, parser) {
    invariant(
      typeAnnotation != null,
      'resolveTypeAnnotation(): typeAnnotation cannot be null',
    );
    let node = typeAnnotation;
    let nullable = false;
    let typeResolutionStatus = {
      successful: false,
    };
    for (;;) {
      if (node.type === 'NullableTypeAnnotation') {
        nullable = true;
        node = node.typeAnnotation;
        continue;
      }
      if (node.type !== 'GenericTypeAnnotation') {
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
    return (typeAnnotation, types, parser) =>
      this.getResolvedTypeAnnotation(typeAnnotation, types, parser);
  }
  extendsForProp(prop, types, parser) {
    const argument = this.argumentForProp(prop);
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
  removeKnownExtends(typeDefinition, types) {
    return typeDefinition.filter(
      prop =>
        prop.type !== 'ObjectTypeSpreadProperty' ||
        this.extendsForProp(prop, types, this) === null,
    );
  }
  getExtendsProps(typeDefinition, types) {
    return typeDefinition
      .filter(prop => prop.type === 'ObjectTypeSpreadProperty')
      .map(prop => this.extendsForProp(prop, types, this))
      .filter(Boolean);
  }
  getProps(typeDefinition, types) {
    const nonExtendsProps = this.removeKnownExtends(typeDefinition, types);
    const props = flattenProperties(nonExtendsProps, types, this)
      .map(property => buildPropSchema(property, types, this))
      .filter(Boolean);
    return {
      props,
      extendsProps: this.getExtendsProps(typeDefinition, types),
    };
  }
  getProperties(typeName, types) {
    const typeAlias = types[typeName];
    try {
      return typeAlias.right.typeParameters.params[0].properties;
    } catch (e) {
      throw new Error(
        `Failed to find type definition for "${typeName}", please check that you have a valid codegen flow file`,
      );
    }
  }
  nextNodeForTypeAlias(typeAnnotation) {
    return typeAnnotation.right;
  }
  nextNodeForEnum(typeAnnotation) {
    return typeAnnotation.body;
  }
  genericTypeAnnotationErrorMessage(typeAnnotation) {
    return `A non GenericTypeAnnotation must be a type declaration ('${this.typeAlias}') or enum ('${this.enumDeclaration}'). Instead, got the unsupported ${typeAnnotation.type}.`;
  }
  extractTypeFromTypeAnnotation(typeAnnotation) {
    return typeAnnotation.type === 'GenericTypeAnnotation'
      ? typeAnnotation.id.name
      : typeAnnotation.type;
  }
  getObjectProperties(typeAnnotation) {
    return typeAnnotation.properties;
  }
  getLiteralValue(option) {
    return option.value;
  }
  getPaperTopLevelNameDeprecated(typeAnnotation) {
    return typeAnnotation.typeParameters.params.length > 1
      ? typeAnnotation.typeParameters.params[1].value
      : null;
  }
}
module.exports = {
  FlowParser,
};
