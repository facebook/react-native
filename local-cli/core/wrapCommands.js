/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const makeCommand = require('./makeCommand');

module.exports = function wrapCommands(commands) {
  const mappedCommands = {};
  Object.keys(commands || []).forEach(k => {
    mappedCommands[k] = makeCommand(commands[k]);
  });
  return mappedCommands;
};
