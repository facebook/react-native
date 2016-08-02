/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const fs = require('fs');

module.exports = function(req, res, next) {
  if (req.url !== '/jsc-profile') {
    next();
    return;
  }

  console.log('Dumping JSC profile information...');
  const dumpName = '/tmp/jsc-profile_' + Date.now() + '.cpuprofile';
  fs.writeFile(dumpName, req.rawBody, (err) => {
    var response = '';
    if (err) {
      response =
        'An error occured when trying to save the profile at ' + dumpName;
      console.error(response, err);
    } else {
      response =
        'Your profile was generated at\n\n' + dumpName + '\n\n' +
        'Open `Chrome Dev Tools > Profiles > Load` '
        + 'and select the profile to visualize it.';
      console.log(response);
    }
    res.end(response);
  });
};
