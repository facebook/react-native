/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

const Promise = require('promise/setimmediate/es6-extensions');

require('promise/setimmediate/done');
require('promise/setimmediate/finally');

if (__DEV__) {
  require('promise/setimmediate/rejection-tracking').enable(
    require('./promiseRejectionTrackingOptions').default,
  );
}

module.exports = Promise;
