/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const main = require('./configs/main');

module.exports = function (babel, options) {
  return main(options);
};

module.exports.getPreset = main.getPreset;
module.exports.passthroughSyntaxPlugins = require('./passthrough-syntax-plugins');
