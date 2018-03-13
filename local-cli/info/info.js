/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const envinfo = require('envinfo');

const info = function() {
  const args = Array.prototype.slice.call(arguments)[2];

  try {
    envinfo.print({
      packages: typeof args.packages === 'string' ? ['react', 'react-native'].concat(args.packages.split(',')) : args.packages
    });
  } catch (error) {
    console.log('Error: unable to print environment info');
    console.log(error);
  }
};

module.exports = {
  name: 'info',
  description: 'Get relevant version info about OS, toolchain and libraries',
  options: [
    {
      command: '--packages [string]',
      description: 'Which packages from your package.json to include, in addition to the default React Native and React versions.',
      default: ['react', 'react-native']
    },
  ],
  examples: [
    {
      desc: 'Get standard version info',
      cmd: 'react-native info',
    },
    {
      desc: 'Get standard version info & specified package versions',
      cmd: 'react-native info --packages jest,eslint,babel-polyfill',
    }
  ],
  func: info,
};
