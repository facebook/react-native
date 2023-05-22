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
  UnionTypeAnnotationMemberType,
  SchemaType,
  NamedShape,
  Nullable,
  NativeModuleParamTypeAnnotation,
  NativeModuleEnumMemberType,
  NativeModuleEnumMembers,
  NativeModuleAliasMap,
  NativeModuleEnumMap,
} from '../../CodegenSchema';
import type {ParserType} from '../errors';
import type {
  GetSchemaInfoFN,
  GetTypeAnnotationFN,
  Parser,
  ResolveTypeAnnotationFN,
} from '../parser';
import type {
  ParserErrorCapturer,
  TypeDeclarationMap,
  PropAST,
  TypeResolutionStatus,
} from '../utils';

const invariant = require('invariant');

const {
  getSchemaInfo,
  getTypeAnnotation,
} = require('./components/componentsUtils');

const {flowTranslateTypeAnnotation} = require('./modules');

// $FlowFixMe[untyped-import] there's no flowtype flow-parser
const flowParser = require('flow-parser');

const {buildSchema} = require('../parsers-commons');
const {Visitor} = require('../parsers-primitives');
const {buildComponentSchema} = require('./components');
const {wrapComponentSchema} = require('../schema.js');
const {buildModuleSchema} = require('../parsers-commons.js');

const fs = require('fs');

const {
  UnsupportedObjectPropertyTypeAnnotationParserError,
} = require('../errors');

class FlowParser implements Parser {
  typeParameterInstantiation: string = 'TypeParameterInstantiation';
  typeAlias: string = 'TypeAlias';
  enumDeclaration: string = 'EnumDeclaration';
  interfaceDeclaration: string = 'InterfaceDeclaration';
  nullLiteralTypeAnnotation: string = 'NullLiteralTypeAnnotation';

  isProperty(property: $FlowFixMe): boolean {
    return property.type === 'ObjectTypeProperty';
  }

  getKeyName(property: $FlowFixMe, hasteModuleName: string): string {
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

  language(): ParserType {
    return 'Flow';
  }

  nameForGenericTypeAnnotation(typeAnnotation: $FlowFixMe): string {
    return typeAnnotation?.id?.name;
  }

  checkIfInvalidModule(typeArguments: $FlowFixMe): boolean {
    return (
      typeArguments.type !== 'TypeParameterInstantiation' ||
      typeArguments.params.length !== 1 ||
      typeArguments.params[0].type !== 'GenericTypeAnnotation' ||
      typeArguments.params[0].id.name !== 'Spec'
    );
  }

  remapUnionTypeAnnotationMemberNames(
    membersTypes: $FlowFixMe[],
  ): UnionTypeAnnotationMemberType[] {
    const remapLiteral = (item: $FlowFixMe) => {
      return item.type
        .replace('NumberLiteralTypeAnnotation', 'NumberTypeAnnotation')
        .replace('StringLiteralTypeAnnotation', 'StringTypeAnnotation');
    };

    return [...new Set(membersTypes.map(remapLiteral))];
  }

  parseFile(filename: string): SchemaType {
    const contents = fs.readFileSync(filename, 'utf8');

    return this.parseString(contents, filename);
  }

  parseString(contents: string, filename: ?string): SchemaType {
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

  parseModuleFixture(filename: string): SchemaType {
    const contents = fs.readFileSync(filename, 'utf8');

    return this.parseString(contents, 'path/NativeSampleTurboModule.js');
  }

  getAst(contents: string): $FlowFixMe {
    return flowParser.parse(contents, {
      enums: true,
    });
  }

  getFunctionTypeAnnotationParameters(
    functionTypeAnnotation: $FlowFixMe,
  ): $ReadOnlyArray<$FlowFixMe> {
    return functionTypeAnnotation.params;
  }

  getFunctionNameFromParameter(
    parameter: NamedShape<Nullable<NativeModuleParamTypeAnnotation>>,
  ): $FlowFixMe {
    return parameter.name;
  }

  getParameterName(parameter: $FlowFixMe): string {
    return parameter.name.name;
  }

  getParameterTypeAnnotation(parameter: $FlowFixMe): $FlowFixMe {
    return parameter.typeAnnotation;
  }

  getFunctionTypeAnnotationReturnType(
    functionTypeAnnotation: $FlowFixMe,
  ): $FlowFixMe {
    return functionTypeAnnotation.returnType;
  }

  parseEnumMembersType(typeAnnotation: $FlowFixMe): NativeModuleEnumMemberType {
    const enumMembersType: ?NativeModuleEnumMemberType =
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

  validateEnumMembersSupported(
    typeAnnotation: $FlowFixMe,
    enumMembersType: NativeModuleEnumMemberType,
  ): void {
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

  parseEnumMembers(typeAnnotation: $FlowFixMe): NativeModuleEnumMembers {
    return typeAnnotation.members.map(member => ({
      name: member.id.name,
      value: member.init?.value ?? member.id.name,
    }));
  }

  isModuleInterface(node: $FlowFixMe): boolean {
    return (
      node.type === 'InterfaceDeclaration' &&
      node.extends.length === 1 &&
      node.extends[0].type === 'InterfaceExtends' &&
      node.extends[0].id.name === 'TurboModule'
    );
  }

  isGenericTypeAnnotation(type: $FlowFixMe): boolean {
    return type === 'GenericTypeAnnotation';
  }

  extractAnnotatedElement(
    typeAnnotation: $FlowFixMe,
    types: TypeDeclarationMap,
  ): $FlowFixMe {
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

  getTypes(ast: $FlowFixMe): TypeDeclarationMap {
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

  callExpressionTypeParameters(callExpression: $FlowFixMe): $FlowFixMe | null {
    return callExpression.typeArguments || null;
  }

  computePartialProperties(
    properties: Array<$FlowFixMe>,
    hasteModuleName: string,
    types: TypeDeclarationMap,
    aliasMap: {...NativeModuleAliasMap},
    enumMap: {...NativeModuleEnumMap},
    tryParse: ParserErrorCapturer,
    cxxOnly: boolean,
  ): Array<$FlowFixMe> {
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

  functionTypeAnnotation(propertyValueType: string): boolean {
    return propertyValueType === 'FunctionTypeAnnotation';
  }

  getTypeArgumentParamsFromDeclaration(declaration: $FlowFixMe): $FlowFixMe {
    return declaration.typeArguments.params;
  }

  /**
   * This FlowFixMe is supposed to refer to typeArgumentParams and
   * funcArgumentParams of generated AST.
   */
  getNativeComponentType(
    typeArgumentParams: $FlowFixMe,
    funcArgumentParams: $FlowFixMe,
  ): {[string]: string} {
    return {
      propsTypeName: typeArgumentParams[0].id.name,
      componentName: funcArgumentParams[0].value,
    };
  }

  getAnnotatedElementProperties(annotatedElement: $FlowFixMe): $FlowFixMe {
    return annotatedElement.right.properties;
  }

  bodyProperties(typeAlias: $FlowFixMe): $ReadOnlyArray<$FlowFixMe> {
    return typeAlias.body.properties;
  }

  convertKeywordToTypeAnnotation(keyword: string): string {
    return keyword;
  }

  argumentForProp(prop: PropAST): $FlowFixMe {
    return prop.argument;
  }

  nameForArgument(prop: PropAST): $FlowFixMe {
    return prop.argument.id.name;
  }

  isOptionalProperty(property: $FlowFixMe): boolean {
    return (
      property.value.type === 'NullableTypeAnnotation' || property.optional
    );
  }

  getGetSchemaInfoFN(): GetSchemaInfoFN {
    return getSchemaInfo;
  }

  getGetTypeAnnotationFN(): GetTypeAnnotationFN {
    return getTypeAnnotation;
  }

  getResolvedTypeAnnotation(
    typeAnnotation: $FlowFixMe,
    types: TypeDeclarationMap,
    parser: Parser,
  ): {
    nullable: boolean,
    typeAnnotation: $FlowFixMe,
    typeResolutionStatus: TypeResolutionStatus,
  } {
    invariant(
      typeAnnotation != null,
      'resolveTypeAnnotation(): typeAnnotation cannot be null',
    );

    let node = typeAnnotation;
    let nullable = false;
    let typeResolutionStatus: TypeResolutionStatus = {
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

      const resolvedTypeAnnotation = types[node.id.name];
      if (resolvedTypeAnnotation == null) {
        break;
      }

      switch (resolvedTypeAnnotation.type) {
        case parser.typeAlias: {
          typeResolutionStatus = {
            successful: true,
            type: 'alias',
            name: node.id.name,
          };
          node = resolvedTypeAnnotation.right;
          break;
        }
        case parser.enumDeclaration: {
          typeResolutionStatus = {
            successful: true,
            type: 'enum',
            name: node.id.name,
          };
          node = resolvedTypeAnnotation.body;
          break;
        }
        default: {
          throw new TypeError(
            `A non GenericTypeAnnotation must be a type declaration ('${parser.typeAlias}') or enum ('${parser.enumDeclaration}'). Instead, got the unsupported ${resolvedTypeAnnotation.type}.`,
          );
        }
      }
    }

    return {
      nullable: nullable,
      typeAnnotation: node,
      typeResolutionStatus,
    };
  }

  getResolveTypeAnnotationFN(): ResolveTypeAnnotationFN {
    return (typeAnnotation, types, parser) =>
      this.getResolvedTypeAnnotation(typeAnnotation, types, parser);
  }
}

module.exports = {
  FlowParser,
};
