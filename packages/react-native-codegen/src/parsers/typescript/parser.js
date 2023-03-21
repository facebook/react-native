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
  NativeModuleEnumMembers,
  NativeModuleEnumMemberType,
  NativeModuleAliasMap,
  NativeModuleEnumMap,
} from '../../CodegenSchema';
import type {ParserType} from '../errors';
import type {Parser} from '../parser';
import type {ParserErrorCapturer, TypeDeclarationMap} from '../utils';

const {typeScriptTranslateTypeAnnotation} = require('./modules');

// $FlowFixMe[untyped-import] Use flow-types for @babel/parser
const babelParser = require('@babel/parser');

const {buildSchema} = require('../parsers-commons');
const {Visitor} = require('../parsers-primitives');
const {buildComponentSchema} = require('./components');
const {wrapComponentSchema} = require('../schema.js');
const {buildModuleSchema} = require('../parsers-commons.js');
const {resolveTypeAnnotation} = require('./utils');

const fs = require('fs');

const {
  UnsupportedObjectPropertyTypeAnnotationParserError,
} = require('../errors');

class TypeScriptParser implements Parser {
  typeParameterInstantiation: string = 'TSTypeParameterInstantiation';

  isProperty(property: $FlowFixMe): boolean {
    return property.type === 'TSPropertySignature';
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
    return 'TypeScript';
  }

  nameForGenericTypeAnnotation(typeAnnotation: $FlowFixMe): string {
    return typeAnnotation.typeName.name;
  }

  checkIfInvalidModule(typeArguments: $FlowFixMe): boolean {
    return (
      typeArguments.type !== 'TSTypeParameterInstantiation' ||
      typeArguments.params.length !== 1 ||
      typeArguments.params[0].type !== 'TSTypeReference' ||
      typeArguments.params[0].typeName.name !== 'Spec'
    );
  }

  remapUnionTypeAnnotationMemberNames(
    membersTypes: $FlowFixMe[],
  ): UnionTypeAnnotationMemberType[] {
    const remapLiteral = (item: $FlowFixMe) => {
      return item.literal
        ? item.literal.type
            .replace('NumericLiteral', 'NumberTypeAnnotation')
            .replace('StringLiteral', 'StringTypeAnnotation')
        : 'ObjectTypeAnnotation';
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
      resolveTypeAnnotation,
      typeScriptTranslateTypeAnnotation,
    );
  }

  parseModuleFixture(filename: string): SchemaType {
    const contents = fs.readFileSync(filename, 'utf8');

    return this.parseString(contents, 'path/NativeSampleTurboModule.ts');
  }

  getAst(contents: string): $FlowFixMe {
    return babelParser.parse(contents, {
      sourceType: 'module',
      plugins: ['typescript'],
    }).program;
  }

  getFunctionTypeAnnotationParameters(
    functionTypeAnnotation: $FlowFixMe,
  ): $ReadOnlyArray<$FlowFixMe> {
    return functionTypeAnnotation.parameters;
  }

  getFunctionNameFromParameter(
    parameter: NamedShape<Nullable<NativeModuleParamTypeAnnotation>>,
  ): $FlowFixMe {
    return parameter.typeAnnotation;
  }

  getParameterName(parameter: $FlowFixMe): string {
    return parameter.name;
  }

  getParameterTypeAnnotation(parameter: $FlowFixMe): $FlowFixMe {
    return parameter.typeAnnotation.typeAnnotation;
  }

  getFunctionTypeAnnotationReturnType(
    functionTypeAnnotation: $FlowFixMe,
  ): $FlowFixMe {
    return functionTypeAnnotation.typeAnnotation.typeAnnotation;
  }

  parseEnumMembersType(typeAnnotation: $FlowFixMe): NativeModuleEnumMemberType {
    const enumInitializer = typeAnnotation.members[0]?.initializer;
    const enumMembersType: ?NativeModuleEnumMemberType =
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

  validateEnumMembersSupported(
    typeAnnotation: $FlowFixMe,
    enumMembersType: NativeModuleEnumMemberType,
  ): void {
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
      if (
        (member.initializer?.type ?? 'StringLiteral') !== enumInitializerType
      ) {
        throw new Error(
          'Enum values can not be mixed. They all must be either blank, number, or string values.',
        );
      }
    });
  }

  parseEnumMembers(typeAnnotation: $FlowFixMe): NativeModuleEnumMembers {
    return typeAnnotation.members.map(member => ({
      name: member.id.name,
      value: member.initializer?.value ?? member.id.name,
    }));
  }

  isModuleInterface(node: $FlowFixMe): boolean {
    return (
      node.type === 'TSInterfaceDeclaration' &&
      node.extends?.length === 1 &&
      node.extends[0].type === 'TSExpressionWithTypeArguments' &&
      node.extends[0].expression.name === 'TurboModule'
    );
  }

  extractAnnotatedElement(
    typeAnnotation: $FlowFixMe,
    types: TypeDeclarationMap,
  ): $FlowFixMe {
    return types[typeAnnotation.typeParameters.params[0].typeName.name];
  }

  /**
   * TODO(T108222691): Use flow-types for @babel/parser
   */
  getTypes(ast: $FlowFixMe): TypeDeclarationMap {
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

  callExpressionTypeParameters(callExpression: $FlowFixMe): $FlowFixMe | null {
    return callExpression.typeParameters || null;
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

  functionTypeAnnotation(propertyValueType: string): boolean {
    return (
      propertyValueType === 'TSFunctionType' ||
      propertyValueType === 'TSMethodSignature'
    );
  }

  getTypeArgumentParamsFromDeclaration(declaration: $FlowFixMe): $FlowFixMe {
    return declaration.typeParameters.params;
  }

  // This FlowFixMe is supposed to refer to typeArgumentParams and funcArgumentParams of generated AST.
  getNativeComponentType(
    typeArgumentParams: $FlowFixMe,
    funcArgumentParams: $FlowFixMe,
  ): {[string]: string} {
    return {
      propsTypeName: typeArgumentParams[0].typeName.name,
      componentName: funcArgumentParams[0].value,
    };
  }

  getAnnotatedElementProperties(annotatedElement: $FlowFixMe): $FlowFixMe {
    return annotatedElement.typeAnnotation.members;
  }
}

module.exports = {
  TypeScriptParser,
};
