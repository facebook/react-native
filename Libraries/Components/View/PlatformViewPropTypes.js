/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

const Platform = require('Platform');

let TVViewPropTypes = {};
// We need to always include TVViewPropTypes on Android
// as unlike on iOS we can't detect TV devices at build time
// and hence make view manager export a different list of native properties.
if (Platform.isTV || Platform.OS === 'android') {
  TVViewPropTypes = require('TVViewPropTypes');
}

module.exports = TVViewPropTypes;
