/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const exec = require('child_process').exec;
const fs = require('fs');
const path = require('path');

module.exports = function(req, res, next) {
  if (req.url !== '/systrace') {
    next();
    return;
  }

  console.log('Dumping profile information...');
  var dumpName = '/tmp/dump_' + Date.now() + '.json';
  var prefix = process.env.TRACE_VIEWER_PATH || '';
  var cmd = path.join(prefix, 'trace2html') + ' ' + dumpName;
  fs.writeFileSync(dumpName, req.rawBody);
  exec(cmd, function(error) {
    if (error) {
      if (error.code === 127) {
        var response = '\n** Failed executing `' + cmd + '` **\n\n' +
          'Google trace-viewer is required to visualize the data, ' +
          'You can install it with `brew install trace2html`\n\n' +
          'NOTE: Your profile data was kept at:\n' + dumpName;
        console.log(response);
        res.end(response);
      } else {
        console.error(error);
        res.end('Unknown error: ' + error.message);
      }
      return;
    } else {
      exec('rm ' + dumpName);
      exec('open ' + dumpName.replace(/json$/, 'html'), function(err) {
        if (err) {
          console.error(err);
          res.end(err.message);
        } else {
          res.end();
        }
      });
    }
  });
};
