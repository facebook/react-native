/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {Struct} from '../StructCollector';

const {serializeConstantsStruct} = require('./serializeConstantsStruct');
const {serializeRegularStruct} = require('./serializeRegularStruct');

export type StructSerilizationOutput = $ReadOnly<{|
  methods: string,
  declaration: string,
|}>;

function serializeStruct(
  moduleName: string,
  struct: Struct,
): StructSerilizationOutput {
  if (struct.context === 'REGULAR') {
    return serializeRegularStruct(moduleName, struct);
  }
  return serializeConstantsStruct(moduleName, struct);
}

module.exports = {
  serializeStruct,
};
