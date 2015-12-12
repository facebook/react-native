/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Wrapper on-top of `optimist` in order to properly support boolean flags
 * and have a slightly less akward API.
 *
 * Usage example:
 *   var argv = parseCommandLine([{
 *     command: 'web',
 *     description: 'Run in a web browser instead of iOS',
 *     default: true
 *   }])
 */
'use strict';

var optimist = require('optimist');

function parseCommandLine(config, args) {
  args = args || process.argv;
  // optimist default API requires you to write the command name three time
  // This is a small wrapper to accept an object instead
  for (var i = 0; i < config.length; ++i) {
    if (config[i].type === 'string') {
      optimist.string(config[i].command);
    } else {
      optimist.boolean(config[i].command);
    }

    optimist
      .default(config[i].command, config[i].default)
      .describe(config[i].command, config[i].description);

    if (config[i].required) {
      optimist.demand(config[i].command);
    }
  }
  var argv = optimist.parse(args);

  // optimist doesn't have support for --dev=false, instead it returns 'false'
  for (var i = 0; i < config.length; ++i) {
    var command = config[i].command;
    if (argv[command] === undefined) {
      argv[command] = config[i].default;
    }
    if (argv[command] === 'true') {
      argv[command] = true;
    }
    if (argv[command] === 'false') {
      argv[command] = false;
    }
    if (config[i].type === 'string') {
      // According to https://github.com/substack/node-optimist#numbers,
      // every argument that looks like a number should be converted to one.
      var strValue = argv[command];
      var numValue = strValue ? Number(strValue) : undefined;
      if (typeof numValue === 'number' && !isNaN(numValue)) {
        argv[command] = numValue;
      }
    }
  }

  // Show --help
  if (argv.help || argv.h) {
    optimist.showHelp();
    process.exit();
  }

  return argv;
}

module.exports = parseCommandLine;
