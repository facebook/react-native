/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const invariant = require('invariant');

class UnrecognizedFlowTypeAnnotationParserError extends Error {
  +typeAnnotationType: string;
  constructor(moduleName: string, typeAnnotationType: string) {
    super(
      `Module ${moduleName}: Detected unsupported type annotation of type '${typeAnnotationType}'`,
    );

    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name;

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);
    this.typeAnnotationType = typeAnnotationType;
  }
}

class UnrecognizedFlowGenericParserError extends Error {
  +genericName: string;
  constructor(moduleName: string, genericName: string) {
    super(
      `Module ${moduleName}: Detected unsupported generic type '${genericName}'`,
    );

    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name;

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);
    this.genericName = genericName;
  }
}

class FlowGenericNotTypeParameterizedParserError extends Error {
  +genericName: string;
  constructor(moduleName: string, genericName: string) {
    super(
      `Module ${moduleName}: Detected a type of ${genericName}, without type parameters.`,
    );

    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name;

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);
    this.genericName = genericName;
  }
}

class FlowGenericTypeParameterCountMismatchParserError extends Error {
  +genericName: string;
  +numTypeParameters: number;

  constructor(
    moduleName: string,
    genericName: string,
    numTypeParameters: number,
    expectedNumTypeParameters: number,
  ) {
    invariant(
      numTypeParameters !== expectedNumTypeParameters,
      `FlowGenericNotTypeParameterizedWithExactlyOneTypeParserError can only be created with numTypeParameters != ${expectedNumTypeParameters}`,
    );

    super(
      `Module ${moduleName}: Detected a type of ${genericName}, with ${numTypeParameters} type parameters specified. Expected exactly ${expectedNumTypeParameters}.`,
    );

    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name;

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);
    this.genericName = genericName;
    this.numTypeParameters = numTypeParameters;
  }
}

class UnnamedFunctionTypeAnnotationParamError extends Error {
  constructor(moduleName: string) {
    super(
      `Module ${moduleName}: Detected a FunctionTypeAnnotation with an unnamed param. Please name all params.`,
    );

    // assign the error class name in your custom error (as a shortcut)
    this.name = this.constructor.name;

    // capturing the stack trace keeps the reference to your error class
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  FlowGenericNotTypeParameterizedParserError,
  FlowGenericTypeParameterCountMismatchParserError,
  UnrecognizedFlowTypeAnnotationParserError,
  UnrecognizedFlowGenericParserError,
  UnnamedFunctionTypeAnnotationParamError,
};
