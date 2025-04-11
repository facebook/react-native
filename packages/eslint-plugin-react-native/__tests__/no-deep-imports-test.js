/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

'use strict';

const rule = require('../no-deep-imports.js');
const ESLintTester = require('./eslint-tester.js');

const eslintTester = new ESLintTester();

eslintTester.run('../no-deep-imports', rule, {
  valid: [
    "import {View} from 'react-native';",
    "const {View} = require('react-native');",
    "import Foo from 'react-native-foo';",
    "import Foo from 'react-native-foo/Foo';",
    "import Foo from 'react/native/Foo';",
  ],
  invalid: [
    {
      code: 'import View from "react-native/Libraries/Components/View/View";',
      errors: [
        {
          messageId: 'deepImport',
          data: {importPath: 'react-native/Libraries/Components/View/View'},
        },
      ],
    },
    {
      code: "const View = require('react-native/Libraries/Components/View/View');",
      errors: [
        {
          messageId: 'deepImport',
          data: {importPath: 'react-native/Libraries/Components/View/View'},
        },
      ],
    },
  ],
});
