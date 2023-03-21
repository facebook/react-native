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

import type {ParserType} from '../errors';
import type {Parser} from '../parser';

class TypeScriptParser implements Parser {
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
}
module.exports = {
  TypeScriptParser,
};
