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
  if (req.url !== '/systrace') {
    next();
    return;
  }

  console.log('Dumping profile information...');
  var dumpName = '/tmp/dump_' + Date.now() + '.json';
  fs.writeFileSync(dumpName, req.rawBody);
  var response =
    'Your profile was saved at:\n' + dumpName + '\n\n' +
    'On Google Chrome navigate to chrome://tracing and then click on "load" ' +
    'to load and visualise your profile.\n\n' +
    'This message is also printed to your console by the packager so you can copy it :)';
  console.log(response);
  res.end(response);
};
