/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @format
 */

'use strict';

const ESLintTester = require('./eslint-tester.js');

const rule = require('../error-subclass-name.js');

const eslintTester = new ESLintTester();

const INVALID_SUPERCLASS_MESSAGE =
  "'SomethingEndingWithError' must extend an error class (like 'Error') because its name is in PascalCase and ends with 'Error'.";
const INVALID_OWN_NAME_MESSAGE =
  "'Foo' may not be the name of an error class. It should be in PascalCase and end with 'Error'.";
const MISSING_OWN_NAME_MESSAGE =
  "An error class should have a PascalCase name ending with 'Error'.";
const INVALID_FUNCTION_NAME_MESSAGE =
  "'SomethingEndingWithError' is a reserved name. PascalCase names ending with 'Error' are reserved for error classes and may not be used for regular functions. Either rename this function or convert it to a class that extends 'Error'.";

eslintTester.run('../error-subclass-name', rule, {
  valid: [
    'class FooError extends Error {}',
    '(class FooError extends Error {})',
    'class FooError extends SomethingEndingWithError {}',
    '(class FooError extends SomethingEndingWithError {})',
    'function makeError() {}',
    '(function () {})',

    // The following cases are currently allowed but could be disallowed in the
    // future. This is technically an escape hatch.
    'class Foo extends SomeLibrary.FooError {}',
    '(class extends SomeLibrary.FooError {})',
  ],
  invalid: [
    {
      code: 'class SomethingEndingWithError {}',
      errors: [{message: INVALID_SUPERCLASS_MESSAGE}],
    },
    {
      code: '(class SomethingEndingWithError {})',
      errors: [{message: INVALID_SUPERCLASS_MESSAGE}],
    },
    {
      code: 'class Foo extends Error {}',
      errors: [{message: INVALID_OWN_NAME_MESSAGE}],
    },
    {
      code: '(class Foo extends Error {})',
      errors: [{message: INVALID_OWN_NAME_MESSAGE}],
    },
    {
      code: 'class Foo extends SomethingEndingWithError {}',
      errors: [{message: INVALID_OWN_NAME_MESSAGE}],
    },
    {
      code: '(class Foo extends SomethingEndingWithError {})',
      errors: [{message: INVALID_OWN_NAME_MESSAGE}],
    },
    {
      code: '(class extends Error {})',
      errors: [{message: MISSING_OWN_NAME_MESSAGE}],
    },
    {
      code: 'class SomethingEndingWithError extends C {}',
      errors: [{message: INVALID_SUPERCLASS_MESSAGE}],
    },
    {
      code: '(class SomethingEndingWithError extends C {})',
      errors: [{message: INVALID_SUPERCLASS_MESSAGE}],
    },
    {
      code: 'function SomethingEndingWithError() {}',
      errors: [{message: INVALID_FUNCTION_NAME_MESSAGE}],
    },
    {
      code: '(function SomethingEndingWithError() {})',
      errors: [{message: INVALID_FUNCTION_NAME_MESSAGE}],
    },

    // The following cases are intentionally disallowed because the member
    // expression `SomeLibrary.FooError` doesn't imply that the superclass is
    // actually declared with the name `FooError`.
    {
      code: 'class SomethingEndingWithError extends SomeLibrary.FooError {}',
      errors: [{message: INVALID_SUPERCLASS_MESSAGE}],
    },
    {
      code: '(class SomethingEndingWithError extends SomeLibrary.FooError {})',
      errors: [{message: INVALID_SUPERCLASS_MESSAGE}],
    },
  ],
});
