
/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 */

'use strict';

var cli = require('./local-cli/cli.js');

function run() {
  cli.run();
}

module.exports = {
  run: run
};
