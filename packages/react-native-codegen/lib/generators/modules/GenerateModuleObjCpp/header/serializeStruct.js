/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 * @format
 */

'use strict';

const _require = require('./serializeConstantsStruct'),
  serializeConstantsStruct = _require.serializeConstantsStruct;
const _require2 = require('./serializeRegularStruct'),
  serializeRegularStruct = _require2.serializeRegularStruct;
function serializeStruct(hasteModuleName, struct) {
  if (struct.context === 'REGULAR') {
    return serializeRegularStruct(hasteModuleName, struct);
  }
  return serializeConstantsStruct(hasteModuleName, struct);
}
module.exports = {
  serializeStruct,
};
