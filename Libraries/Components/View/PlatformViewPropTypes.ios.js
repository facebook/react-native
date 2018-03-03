/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule PlatformViewPropTypes
 * @flow
 */

const Platform = require('Platform');

let TVViewPropTypes = {};
if (Platform.isTVOS) {
  TVViewPropTypes = require('TVViewPropTypes');
}

module.exports = TVViewPropTypes;
