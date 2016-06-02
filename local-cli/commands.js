/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
'use strict';

const Config = require('./util/Config');

export type Command = {
  name: string,
  description?: string,
  usage?: string,
  func: (argv: Array<string>, config: Config, args: Object) => ?Promise,
  options?: Array<{
    command: string,
    description?: string,
    default?: (config: Config) => any | any,
  }>,
};

const documentedCommands: Array<Command> = [
  require('./server/server'),
  require('./runIOS/runIOS'),
  require('./runAndroid/runAndroid'),
  require('./library/library'),
  // @todo(mike) start rewriting these files one by one
  // require('./bundle/bundle'),
  // require('./bundle/unbundle'),
  //
  // require('./upgrade/upgrade'),
  // require('./link/link'),
  // require('./link/unlink'),
];

// The user should never get here because projects are inited by
// using `react-native-cli` from outside a project directory.
const undocumentedCommands: Array<Command> = [
  {
    name: 'init',
    func: () => {
      console.log([
        'Looks like React Native project already exists in the current',
        'folder. Run this command from a different folder or remove node_modules/react-native'
      ].join('\n'));
    },
  },
];

module.exports = documentedCommands.concat(undocumentedCommands);
