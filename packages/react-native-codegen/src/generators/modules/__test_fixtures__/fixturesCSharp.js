/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const fixtures = require('./fixtures.js');

module.exports = {
  complex_objects: fixtures.complex_objects,
  two_modules_different_files: fixtures.two_modules_different_files,
  empty_native_modules: fixtures.empty_native_modules,
  simple_native_modules: fixtures.simple_native_modules,
  native_modules_with_type_aliases: fixtures.native_modules_with_type_aliases,
  real_module_example: fixtures.real_module_example,
  cxx_only_native_modules: fixtures.cxx_only_native_modules,
  SampleWithUppercaseName: fixtures.SampleWithUppercaseName,
};
