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

/**
 * Wrapper required to abstract away from the actual codegen.
 * This is needed because, when running tests in Sandcastle, not everything is setup as usually.
 * For example, the `@react-native/codegen` lib is not present.
 *
 * Thanks to this wrapper, we are able to mock the getter for the codegen in a way that allow us to return
 * a custom object which mimics the Codegen interface.
 *
 * @return an object that can generate the code for the New Architecture.
 */
function getCodegen() /*: $FlowFixMe */ {
  let RNCodegen;
  try {
    // $FlowIgnore[cannot-resolve-module]
    RNCodegen = require('../../packages/react-native-codegen/lib/generators/RNCodegen.js');
  } catch (e) {
    // $FlowIgnore[cannot-resolve-module]
    RNCodegen = require('@react-native/codegen/lib/generators/RNCodegen.js');
  }
  if (!RNCodegen) {
    throw 'RNCodegen not found.';
  }
  return RNCodegen;
}

function getCombineJSToSchema() /*: $FlowFixMe */ {
  let combineJSToSchema;
  try {
    // $FlowIgnore[cannot-resolve-module]
    combineJSToSchema = require('../../packages/react-native-codegen/lib/cli/combine/combine-js-to-schema.js');
  } catch (e) {
    // $FlowIgnore[cannot-resolve-module]
    combineJSToSchema = require('@react-native/codegen/lib/cli/combine/combine-js-to-schema.js');
  }
  if (!combineJSToSchema) {
    throw 'combine-js-to-schema not found.';
  }
  return combineJSToSchema;
}

module.exports = {
  getCodegen,
  getCombineJSToSchema,
};
