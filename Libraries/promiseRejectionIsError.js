/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule promiseRejectionIsError
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
