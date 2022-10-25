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

/**
 * This is the main interface for Parsers of various languages.
 * It exposes all the methods that contain language-specific logic.
 */
export interface Parser {
  /**
   * Given a type annotation for a generic type, it returns the type name.
   * @parameter typeAnnotation: the annotation for a type in the AST.
   * @returns: the name of the type.
   */
  nameForGenericTypeAnnotation(typeAnnotation: $FlowFixMe): string;
}
