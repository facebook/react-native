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

import type {ParserType} from './errors';

/**
 * This is the main interface for Parsers of various languages.
 * It exposes all the methods that contain language-specific logic.
 */
export interface Parser {
  /**
   * Given a type declaration, it possibly returns the name of the Enum type.
   * @parameter maybeEnumDeclaration: an object possibly containing an Enum declaration.
   * @returns: the name of the Enum type.
   */
  getMaybeEnumMemberType(maybeEnumDeclaration: $FlowFixMe): string;
  /**
   * Given a type declaration, it returns a boolean specifying if is an Enum declaration.
   * @parameter maybeEnumDeclaration: an object possibly containing an Enum declaration.
   * @returns: a boolean specifying if is an Enum declaration.
   */
  isEnumDeclaration(maybeEnumDeclaration: $FlowFixMe): boolean;
  /**
   * @returns: the Parser language.
   */
  language(): ParserType;
  /**
   * Given a type annotation for a generic type, it returns the type name.
   * @parameter typeAnnotation: the annotation for a type in the AST.
   * @returns: the name of the type.
   */
  nameForGenericTypeAnnotation(typeAnnotation: $FlowFixMe): string;
}
