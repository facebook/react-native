/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

require('./Promise'); // make sure the default rejection handler is installed
const rejectionTracking = require('promise/setimmediate/rejection-tracking');

module.exports = () => {
  rejectionTracking.enable({
    allRejections: true,
    onUnhandled: (id, error) => {
      console.error(error);
    },
    onHandled: () => {},
  });
};
