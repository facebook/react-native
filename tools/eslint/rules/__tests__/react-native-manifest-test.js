/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const rule = require('../react-native-manifest.js');
const {RuleTester} = require('eslint');

const ruleTester = new RuleTester({
  parser: require.resolve('jsonc-eslint-parser'),
});

ruleTester.run('react-native-manifest', rule, {
  valid: [
    {
      code: JSON.stringify({
        name: '@react-native/package-name',
      }),
    },
    {
      code: JSON.stringify({
        name: '@react-native/package-name',
        dependencies: {
          dependencyA: '1.0.0',
        },
        devDependencies: {
          dependencyB: '1.0.0',
        },
      }),
    },
    {
      code: JSON.stringify({
        name: '@react-native/monorepo',
        devDependencies: {
          dependencyB: '1.0.0',
        },
      }),
    },
    {
      code: JSON.stringify({
        name: 'react-native',
        dependencies: {
          dependencyA: '1.0.0',
        },
      }),
    },
  ],
  invalid: [
    {
      code: JSON.stringify({
        name: '@react-native/monorepo',
        dependencies: {
          dependencyA: '1.0.0',
        },
      }),
      errors: [
        {
          messageId: 'propertyDisallowed',
          data: {
            property: 'dependencies',
            describe:
              "Declare 'dependencies' in `packages/react-native/package.json`.",
          },
        },
      ],
    },
    {
      code: JSON.stringify({
        name: 'react-native',
        devDependencies: {
          dependencyA: '1.0.0',
        },
      }),
      errors: [
        {
          messageId: 'propertyDisallowed',
          data: {
            property: 'devDependencies',
            describe: "Declare 'devDependencies' in `<root>/package.json`.",
          },
        },
      ],
    },
  ],
});
