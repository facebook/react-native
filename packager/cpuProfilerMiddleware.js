/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const execFile = require('child_process').execFile;
const fs = require('fs');
const path = require('path');

module.exports = function(req, res, next) {
  if (req.url !== '/cpu-profile') {
    next();
    return;
  }

  console.log('Dumping CPU profile information...');
  var dumpName = '/tmp/cpu-profile_' + Date.now();
  fs.writeFileSync(dumpName + '.json', req.rawBody);

  var cmdPath = path.join(
    __dirname,
    '../react-native-github/JSCLegacyProfiler/json2trace'
  );
  execFile(
    cmdPath,
    [
      '-cpuprofiler',
       dumpName + '.cpuprofile ' + dumpName + '.json'
    ],
    function(error) {
      if (error) {
        console.error(error);
        res.end('Unknown error: ' + error.message);
      } else {
        var response = 'Your profile was generated at\n\n' + dumpName + '.cpuprofile\n\n' +
          'Open `Chrome Dev Tools > Profiles > Load` and select the profile to visualize it.';
        console.log(response);
        res.end(response);
      }
    }
  );
};
