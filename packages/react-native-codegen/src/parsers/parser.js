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

import type {UnionTypeAnnotationMemberType} from '../CodegenSchema.js';
import type {ParserType} from './errors';

/**
 * This is the main interface for Parsers of various languages.
 * It exposes all the methods that contain language-specific logic.
 */
export interface Parser {
  /**
   * This is the TypeParameterInstantiation value
   */
  typeParameterInstantiation: string;

  /**
   * Given a property or an index declaration, it returns the key name.
   * @parameter propertyOrIndex: an object containing a property or an index declaration.
   * @parameter hasteModuleName: a string with the native module name.
   * @returns: the key name.
   * @throws if propertyOrIndex does not contain a property or an index declaration.
   */
  getKeyName(propertyOrIndex: $FlowFixMe, hasteModuleName: string): string;
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
  /**
   * Given a type arguments, it returns a boolean specifying if the Module is Invalid.
   * @parameter typeArguments: the type arguments.
   * @returns: a boolean specifying if the Module is Invalid.
   */
  checkIfInvalidModule(typeArguments: $FlowFixMe): boolean;
  /**
   * Given a union annotation members types, it returns an array of remaped members names without duplicates.
   * @parameter membersTypes: union annotation members types
   * @returns: an array of remaped members names without duplicates.
   */
  remapUnionTypeAnnotationMemberNames(
    types: $FlowFixMe,
  ): UnionTypeAnnotationMemberType[];
}
