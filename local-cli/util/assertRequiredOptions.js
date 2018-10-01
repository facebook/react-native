/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {Option} = require('commander');
const {camelCase} = require('lodash');

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
