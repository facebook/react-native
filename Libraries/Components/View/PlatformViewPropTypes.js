/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PlatformViewPropTypes
 * @flow
 */

const Platform = require('Platform');

var TVViewPropTypes = {};
// We need to always include TVViewPropTypes on Android
// as unlike on iOS we can't detect TV devices at build time
// and hence make view manager export a different list of native properties.
if (Platform.isTV || Platform.OS === 'android') {
  TVViewPropTypes = require('TVViewPropTypes');
}

module.exports = TVViewPropTypes;
