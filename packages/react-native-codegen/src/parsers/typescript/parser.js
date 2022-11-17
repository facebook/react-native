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
  typeParameterInstantiation: string = 'TSTypeParameterInstantiation';

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
}
module.exports = {
  TypeScriptParser,
};
