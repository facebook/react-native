/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

/* eslint-disable */
var workerFarm = require('../../')
  , workers    = workerFarm(require.resolve('./child'))
  , ret        = 0

for (var i = 0; i < 10; i++) {
  workers('#' + i + ' FOO', function (err, outp) {
    console.log(outp)
    if (++ret == 10)
      workerFarm.end(workers)
  })
}
