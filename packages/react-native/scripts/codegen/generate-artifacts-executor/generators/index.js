/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {
  generateAppDependencyProvider,
} = require('./generateAppDependencyProvider');
const {generateCustomURLHandlers} = require('./generateCustomURLHandlers');
const {generateNativeCode} = require('./generateNativeCode');
const {generateRCTModuleProviders} = require('./generateRCTModuleProviders');
const {
  generateRCTThirdPartyComponents,
} = require('./generateRCTThirdPartyComponents');
const {generateReactCodegenPodspec} = require('./generateReactCodegenPodspec');
const {generateSchemaInfos} = require('./generateSchemaInfos');

module.exports = {
  generateSchemaInfos,
  generateNativeCode,
  generateRCTThirdPartyComponents,
  generateRCTModuleProviders,
  generateCustomURLHandlers,
  generateAppDependencyProvider,
  generateReactCodegenPodspec,
};
