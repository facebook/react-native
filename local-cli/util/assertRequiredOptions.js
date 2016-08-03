/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const { Option } = require('commander');
const { camelCase } = require('lodash');

// Commander.js has a 2 years old open issue to support <...> syntax
// for options. Until that gets merged, we run the checks manually
// https://github.com/tj/commander.js/issues/230
module.exports = function assertRequiredOptions(options, passedOptions) {
  options.forEach(opt => {
    const option = new Option(opt.command);

    if (!option.required) {
      return;
    }

    const name = camelCase(option.long);

    if (!passedOptions[name]) {
      // Provide commander.js like error message
      throw new Error(`error: option '${option.long}' missing`);
    }
  });
};
