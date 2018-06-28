/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const envinfo = require('envinfo');

const info = function() {
  const args = Array.prototype.slice.call(arguments)[2];

  try {
    envinfo
      .run(
        {
          System: ['OS', 'CPU', 'Memory', 'Shell'],
          Binaries: ['Node', 'Yarn', 'npm', 'Watchman'],
          IDEs: ['Xcode', 'Android Studio'],
          SDKs: ['iOS SDK', 'Android SDK'],
          npmPackages:
            (typeof args.packages === 'string' &&
              !args.packages.includes('*')) ||
            !args.packages
              ? ['react', 'react-native'].concat(
                  (args.packages || '').split(','),
                )
              : args.packages,
          npmGlobalPackages: '*react-native*',
        },
        {
          clipboard: !!args.clipboard,
          title: 'React Native Environment Info',
        },
      )
      .then(console.log)
      .catch(err => {
        console.log('Error: unable to print environment info');
        console.log(err);
      });
  } catch (err) {
    console.log('Error: unable to print environment info');
    console.log(err);
  }
};

module.exports = {
  name: 'info',
  description: 'Get relevant version info about OS, toolchain and libraries',
  options: [
    {
      command: '--packages [string]',
      description:
        'Which packages from your package.json to include, in addition to the default React Native and React versions.',
    },
    {
      command: '--clipboard [boolean]',
      description:
        'Automagically copy the environment report output to the clipboard',
    },
  ],
  examples: [
    {
      desc: 'Get standard version info',
      cmd: 'react-native info',
    },
    {
      desc: 'Get standard version info & specified package versions',
      cmd: 'react-native info --packages jest,eslint',
    },
    {
      desc: 'Get standard version info & globbed package versions',
      cmd: 'react-native info --packages "*react*"',
    },
    {
      desc: 'Get standard version info & all package versions',
      cmd: 'react-native info --packages',
    },
  ],
  func: info,
};
