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
} from '../CodegenSchema';

// $FlowFixMe[untyped-import] there's no flowtype flow-parser
const flowParser = require('flow-parser');
const {
  UnsupportedObjectPropertyTypeAnnotationParserError,
} = require('./errors');

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

  getMaybeEnumMemberType(maybeEnumDeclaration: $FlowFixMe): string {
    return maybeEnumDeclaration.body.type
      .replace('EnumNumberBody', 'NumberTypeAnnotation')
      .replace('EnumStringBody', 'StringTypeAnnotation');
  }

  isEnumDeclaration(maybeEnumDeclaration: $FlowFixMe): boolean {
    return maybeEnumDeclaration.type === 'EnumDeclaration';
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
    return {
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
}
