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

class FlowParser implements Parser {
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
}

module.exports = {
  FlowParser,
};
