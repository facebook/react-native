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

import type {Parser} from './parser';
import type {ParserType} from './errors';
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
} from '../CodegenSchema';
import type {ParserErrorCapturer, TypeDeclarationMap} from './utils';

// $FlowFixMe[untyped-import] there's no flowtype flow-parser
const flowParser = require('flow-parser');
const {
  UnsupportedObjectPropertyTypeAnnotationParserError,
} = require('./errors');

const schemaMock = {
  modules: {
    StringPropNativeComponentView: {
      type: 'Component',
      components: {
        StringPropNativeComponentView: {
          extendsProps: [],
          events: [],
          props: [],
          commands: [],
        },
      },
    },
  },
};

export class MockedParser implements Parser {
  typeParameterInstantiation: string = 'TypeParameterInstantiation';

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
    return typeAnnotation.id.name;
  }

  checkIfInvalidModule(typeArguments: $FlowFixMe): boolean {
    return false;
  }

  remapUnionTypeAnnotationMemberNames(
    membersTypes: $FlowFixMe[],
  ): UnionTypeAnnotationMemberType[] {
    return [];
  }

  parseFile(filename: string): SchemaType {
    return schemaMock;
  }

  parseString(contents: string, filename: ?string): SchemaType {
    return schemaMock;
  }

  parseModuleFixture(filename: string): SchemaType {
    return schemaMock;
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
    return typeAnnotation.type;
  }

  validateEnumMembersSupported(
    typeAnnotation: $FlowFixMe,
    enumMembersType: NativeModuleEnumMemberType,
  ): void {
    return;
  }

  parseEnumMembers(typeAnnotation: $FlowFixMe): NativeModuleEnumMembers {
    return typeAnnotation.type === 'StringTypeAnnotation'
      ? [
          {
            name: 'Hello',
            value: 'hello',
          },
          {
            name: 'Goodbye',
            value: 'goodbye',
          },
        ]
      : [
          {
            name: 'On',
            value: '1',
          },
          {
            name: 'Off',
            value: '0',
          },
        ];
  }

  isModuleInterface(node: $FlowFixMe): boolean {
    return (
      node.type === 'InterfaceDeclaration' &&
      node.extends.length === 1 &&
      node.extends[0].type === 'InterfaceExtends' &&
      node.extends[0].id.name === 'TurboModule'
    );
  }

  extractAnnotatedElement(
    typeAnnotation: $FlowFixMe,
    types: TypeDeclarationMap,
  ): $FlowFixMe {
    return types[typeAnnotation.typeParameters.params[0].id.name];
  }

  getTypes(ast: $FlowFixMe): TypeDeclarationMap {
    return {};
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
    return [
      {
        name: 'a',
        optional: true,
        typeAnnotation: {type: 'StringTypeAnnotation'},
      },
      {
        name: 'b',
        optional: true,
        typeAnnotation: {type: 'BooleanTypeAnnotation'},
      },
    ];
  }

  functionTypeAnnotation(propertyValueType: string): boolean {
    return propertyValueType === 'FunctionTypeAnnotation';
  }

  getTypeArgumentParamsFromDeclaration(declaration: $FlowFixMe): $FlowFixMe {
    return declaration.typeArguments.params;
  }

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
}
