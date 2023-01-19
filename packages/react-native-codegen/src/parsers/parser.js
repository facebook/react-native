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
} from '../CodegenSchema';
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
   * Given a declaration, it returns true if it is a property
   */
  isProperty(property: $FlowFixMe): boolean;
  /**
   * Given a property declaration, it returns the key name.
   * @parameter property: an object containing a property declaration.
   * @parameter hasteModuleName: a string with the native module name.
   * @returns: the key name.
   * @throws if property does not contain a property declaration.
   */
  getKeyName(property: $FlowFixMe, hasteModuleName: string): string;
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
  /**
   * Given the content of a file and options, it returns an AST.
   * @parameter contents: the content of the file.
   * @returns: the AST of the file (given in program property for typescript).
   */
  parseFile(filename: string): SchemaType;

  /**
   * Given the content of a file, it returns an AST.
   * @parameter contents: the content of the file.
   * @returns: the AST of the file.
   */
  getAst(contents: string): $FlowFixMe;

  /**
   * Given a FunctionTypeAnnotation, it returns an array of its parameters.
   * @parameter functionTypeAnnotation: a FunctionTypeAnnotation
   * @returns: the parameters of the FunctionTypeAnnotation.
   */
  getFunctionTypeAnnotationParameters(
    functionTypeAnnotation: $FlowFixMe,
  ): $ReadOnlyArray<$FlowFixMe>;

  /**
   * Given a parameter, it returns the function name of the parameter.
   * @parameter parameter: a parameter of a FunctionTypeAnnotation.
   * @returns: the function name of the parameter.
   */
  getFunctionNameFromParameter(
    parameter: NamedShape<Nullable<NativeModuleParamTypeAnnotation>>,
  ): $FlowFixMe;

  /**
   * Given a parameter, it returns its name.
   * @parameter parameter: a parameter of a FunctionTypeAnnotation.
   * @returns: the name of the parameter.
   */
  getParameterName(parameter: $FlowFixMe): string;

  /**
   * Given a parameter, it returns its typeAnnotation.
   * @parameter parameter: a parameter of a FunctionTypeAnnotation.
   * @returns: the typeAnnotation of the parameter.
   */
  getParameterTypeAnnotation(param: $FlowFixMe): $FlowFixMe;

  /**
   * Given a FunctionTypeAnnotation, it returns its returnType.
   * @parameter functionTypeAnnotation: a FunctionTypeAnnotation
   * @returns: the returnType of the FunctionTypeAnnotation.
   */
  getFunctionTypeAnnotationReturnType(
    functionTypeAnnotation: $FlowFixMe,
  ): $FlowFixMe;
}
