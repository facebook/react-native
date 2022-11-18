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

import type {UnionTypeAnnotationMemberType} from '../../CodegenSchema.js';
import type {ParserType} from '../errors';
import type {Parser} from '../parser';

const {
  UnsupportedObjectPropertyTypeAnnotationParserError,
} = require('../errors');

class FlowParser implements Parser {
  typeParameterInstantiation: string = 'TypeParameterInstantiation';

  getKeyName(propertyOrIndex: $FlowFixMe, hasteModuleName: string): string {
    switch (propertyOrIndex.type) {
      case 'ObjectTypeProperty':
        return propertyOrIndex.key.name;
      case 'ObjectTypeIndexer':
        // flow index name is optional
        return propertyOrIndex.id?.name ?? 'key';
      default:
        throw new UnsupportedObjectPropertyTypeAnnotationParserError(
          hasteModuleName,
          propertyOrIndex,
          propertyOrIndex.type,
          this.language(),
        );
    }
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
}

module.exports = {
  FlowParser,
};
