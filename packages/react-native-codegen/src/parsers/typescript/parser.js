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
} from '../../CodegenSchema';
import type {ParserType} from '../errors';
import type {Parser} from '../parser';

// $FlowFixMe[untyped-import] Use flow-types for @babel/parser
const babelParser = require('@babel/parser');

const {buildSchema} = require('../parsers-commons');
const {Visitor} = require('./Visitor');
const {buildComponentSchema} = require('./components');
const {wrapComponentSchema} = require('./components/schema');
const {buildModuleSchema} = require('./modules');

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

  getMaybeEnumMemberType(maybeEnumDeclaration: $FlowFixMe): string {
    if (maybeEnumDeclaration.members[0].initializer) {
      return maybeEnumDeclaration.members[0].initializer.type
        .replace('NumericLiteral', 'NumberTypeAnnotation')
        .replace('StringLiteral', 'StringTypeAnnotation');
    }

    return 'StringTypeAnnotation';
  }

  isEnumDeclaration(maybeEnumDeclaration: $FlowFixMe): boolean {
    return maybeEnumDeclaration.type === 'TSEnumDeclaration';
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

    return buildSchema(
      contents,
      filename,
      wrapComponentSchema,
      buildComponentSchema,
      buildModuleSchema,
      Visitor,
      this,
    );
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
}
module.exports = {
  TypeScriptParser,
};
